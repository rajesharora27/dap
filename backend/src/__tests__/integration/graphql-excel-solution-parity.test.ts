
import request from 'supertest';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { typeDefs } from '../../schema/typeDefs';
import { resolvers } from '../../schema/resolvers';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { TestFactory } from '../factories/TestFactory';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

describe('GraphQL API - Solution Export/Import Parity', () => {
    let app: express.Application;
    let server: ApolloServer;
    let authToken: string;
    let testUser: any;

    beforeAll(async () => {
        app = express();
        app.use(express.json());

        const schema = makeExecutableSchema({ typeDefs, resolvers });
        server = new ApolloServer({ schema });
        await server.start();

        app.use('/graphql', expressMiddleware(server, {
            context: async ({ req }: { req: express.Request }) => {
                if (!req.headers.authorization) return { prisma, user: null, productRefs: [] };
                return {
                    prisma,
                    productRefs: [],
                    user: {
                        id: testUser?.id,
                        userId: testUser?.id,
                        role: testUser?.role,
                        isAdmin: testUser?.isAdmin
                    }
                };
            }
        }));
    });

    beforeEach(async () => {
        await TestFactory.cleanup();

        testUser = await TestFactory.createUser({
            email: 'solparity@example.com',
            username: 'solparity',
            role: 'ADMIN',
            isAdmin: true
        });

        authToken = jwt.sign(
            { userId: testUser.id },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        await TestFactory.cleanup();
        await server.stop();
        await prisma.$disconnect();
    });

    it('should export solution with Products tab and import it back correctly', async () => {
        // 1. Setup Data
        const product1 = await TestFactory.createProduct({ name: 'Linked Product 1', description: 'desc 1' });
        const product2 = await TestFactory.createProduct({ name: 'Linked Product 2', description: 'desc 2' });

        const solution = await TestFactory.createSolution({
            name: 'Parity Solution',
            description: 'Testing Parity'
        });

        // Link products
        await prisma.solutionProduct.create({
            data: { solutionId: solution.id, productId: product1.id, order: 1 }
        });
        await prisma.solutionProduct.create({
            data: { solutionId: solution.id, productId: product2.id, order: 2 }
        });

        // 2. Export Solution
        const exportResponse = await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
                    query ExportSolution($solutionId: ID!) {
                        exportSolution(solutionId: $solutionId) {
                            filename
                            content
                        }
                    }
                `,
                variables: { solutionId: solution.id }
            });

        if (exportResponse.status !== 200) {
            console.error('Export Error Body:', JSON.stringify(exportResponse.body, null, 2));
        }
        expect(exportResponse.status).toBe(200);
        const exportData = exportResponse.body.data.exportSolution;
        expect(exportData).toBeDefined();

        // 3. Verify Excel Content ("Products" sheet)
        const buffer = Buffer.from(exportData.content, 'base64');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const productsSheet = workbook.getWorksheet('Products');
        expect(productsSheet).toBeDefined();
        if (productsSheet) {
            expect(productsSheet.rowCount).toBeGreaterThan(1); // Header + 2 rows
            const row1 = productsSheet.getRow(1);
            const row2 = productsSheet.getRow(2);
            const row3 = productsSheet.getRow(3);

            // Assuming columns: ID (hidden), Product Name, Description, Display Order
            const names = [row2.getCell(2).value, row3.getCell(2).value];
            expect(names).toContain('Linked Product 1');
            expect(names).toContain('Linked Product 2');
        }

        // 4. Import (Commit) to create a NEW Solution (rename inside buffer to avoid conflict if unique constraint exists on name, though test DB is clean)
        // Actually, let's modify the buffer to change Solution Name so we create a NEW solution
        const solutionInfoSheet = workbook.getWorksheet('Solution Info');
        // Assuming (2,2) is Name - but let's be careful. Header is row 1.
        // Let's iterate cells to find header 'Solution Name'
        if (solutionInfoSheet) {
            let nameCol = 1;
            solutionInfoSheet.getRow(1).eachCell((cell, colNumber) => {
                if (cell.value === 'Solution Name') nameCol = colNumber;
            });
            solutionInfoSheet.getCell(2, nameCol).value = 'Parity Solution Imported';
        }

        const newBuffer = await workbook.xlsx.writeBuffer();
        const base64Content = Buffer.from(newBuffer).toString('base64');

        // Execute Dry Run
        const dryRunResponse = await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
                    mutation ImportDryRun($content: String!, $entityType: EntityType) {
                        importDryRun(content: $content, entityType: $entityType) {
                            sessionId
                            isValid
                            summary {
                                toCreate
                            }
                            records {
                                productRefs {
                                    action
                                    data
                                }
                            }
                            errors {
                                message
                            }
                        }
                    }
                `,
                variables: {
                    content: base64Content,
                    entityType: 'SOLUTION'
                }
            });

        expect(dryRunResponse.status).toBe(200);
        if (!dryRunResponse.body.data) {
            console.error('Dry Run Body (No Data):', JSON.stringify(dryRunResponse.body, null, 2));
        }
        const dryRunResult = dryRunResponse.body.data?.importDryRun;

        if (dryRunResult.errors.length > 0) {
            console.error('Dry Run Errors:', JSON.stringify(dryRunResult.errors, null, 2));
        }
        expect(dryRunResult.isValid).toBe(true);
        // Should have found products to link
        expect(dryRunResult.records.productRefs.length).toBe(2);

        // Execute Commit
        const commitResponse = await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
                    mutation ImportCommit($sessionId: String!) {
                        importCommit(sessionId: $sessionId) {
                            success
                            entityId
                            stats {
                                productLinksCreated
                            }
                        }
                    }
                `,
                variables: { sessionId: dryRunResult.sessionId }
            });

        expect(commitResponse.status).toBe(200);
        const commitResult = commitResponse.body.data.importCommit;
        expect(commitResult.success).toBe(true);
        expect(commitResult.stats.productLinksCreated).toBe(2); // Should link 2 products

        // 5. Verify Database
        const newSolutionId = commitResult.entityId;
        const newSolution = await prisma.solution.findUnique({
            where: { id: newSolutionId },
            include: { products: { include: { product: true } } }
        });

        expect(newSolution).toBeDefined();
        expect(newSolution?.name).toBe('Parity Solution Imported');
        expect(newSolution?.products).toHaveLength(2);
        const linkedNames = newSolution?.products.map(p => p.product.name);
        expect(linkedNames).toContain('Linked Product 1');
        expect(linkedNames).toContain('Linked Product 2');
    });
});
