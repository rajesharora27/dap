
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

describe('GraphQL API - Excel Import Tags Integration', () => {
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
                if (!req.headers.authorization) return { prisma, user: null };
                return {
                    prisma,
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
            email: 'importtest@example.com',
            username: 'importtest',
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

    it('should import product with new Tags and associate them with tasks', async () => {
        // 1. Create Excel File with Tags
        const workbook = new ExcelJS.Workbook();

        // Product Info
        const infoSheet = workbook.addWorksheet('Product Info');
        infoSheet.addRow(['Product Name', 'Description']);
        infoSheet.addRow(['Imported Tags Product', 'Test product for tags import']);

        // Tags Sheet (Crucial)
        const tagsSheet = workbook.addWorksheet('Tags');
        tagsSheet.addRow(['Tag Name', 'Color', 'Display Order']);
        tagsSheet.addRow(['New Import Tag', '#00FF00', 1]);

        // Tasks Sheet (Assigning the tag)
        const tasksSheet = workbook.addWorksheet('Tasks');
        tasksSheet.addRow(['Task Name', 'Description', 'Sequence', 'License Level', 'Weight', 'Est. Minutes', 'Tags']);
        tasksSheet.addRow(['Task with Tag', 'Description', 1, 'Essential', 1, 60, 'New Import Tag']);

        // Other required sheets (minimum valid structure)
        const licensesSheet = workbook.addWorksheet('Licenses');
        licensesSheet.addRow(['License Name', 'License Level', 'Description', 'Is Active']);

        const releasesSheet = workbook.addWorksheet('Releases');
        releasesSheet.addRow(['Release Name', 'Release Level', 'Description', 'Is Active']);

        const outcomesSheet = workbook.addWorksheet('Outcomes');
        outcomesSheet.addRow(['Outcome Name', 'Description']);

        const customAttrsSheet = workbook.addWorksheet('Custom Attributes');
        customAttrsSheet.addRow(['Attribute Name', 'Attribute Value', 'Data Type', 'Description', 'Is Required', 'Display Order']);

        // Generate Buffer
        const buffer = await workbook.xlsx.writeBuffer();
        const base64Content = Buffer.from(buffer).toString('base64');

        // 2. Execute V2 Dry Run
        const dryRunResponse = await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
          mutation ImportV2DryRun($content: String!, $entityType: EntityType) {
            importV2DryRun(content: $content, entityType: $entityType) {
              sessionId
              isValid
              summary {
                totalRecords
                toCreate
                errorCount
              }
              errors {
                message
                sheet
                row
              }
            }
          }
        `,
                variables: {
                    content: base64Content,
                    entityType: 'PRODUCT'
                }
            });

        if (dryRunResponse.status !== 200) {
            console.error('Dry Run Status:', dryRunResponse.status);
            console.error('Dry Run Body:', JSON.stringify(dryRunResponse.body, null, 2));
        }
        expect(dryRunResponse.status).toBe(200);

        const dryRunResult = dryRunResponse.body.data.importV2DryRun;
        if (dryRunResult.errors && dryRunResult.errors.length > 0) {
            console.error('Dry Run Errors:', dryRunResult.errors);
        }
        expect(dryRunResult.isValid).toBe(true);
        expect(dryRunResult.sessionId).toBeDefined();

        // 3. Execute V2 Commit
        const commitResponse = await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
          mutation ImportV2Commit($sessionId: String!) {
            importV2Commit(sessionId: $sessionId) {
              success
              entityId
              stats {
                tagsCreated
                tasksCreated
              }
              errors {
                message
              }
            }
          }
        `,
                variables: {
                    sessionId: dryRunResult.sessionId
                }
            });

        if (commitResponse.status !== 200) {
            console.error('Commit Status:', commitResponse.status);
            console.error('Commit Body:', JSON.stringify(commitResponse.body, null, 2));
        }
        expect(commitResponse.status).toBe(200);

        const commitResult = commitResponse.body.data.importV2Commit;
        expect(commitResult.success).toBe(true);
        expect(commitResult.stats.tagsCreated).toBe(1);
        expect(commitResult.stats.tasksCreated).toBe(1);

        // Use the returned entityId for verification
        const productId = commitResult.entityId;

        // 4. Verify Database State
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                tags: true,
                tasks: {
                    include: {
                        taskTags: {
                            include: {
                                tag: true
                            }
                        }
                    }
                }
            }
        });

        expect(product).toBeDefined();
        if (product) {
            // Verify Tag Creation
            expect(product.tags.length).toBe(1);
            expect(product.tags[0].name).toBe('New Import Tag');
            expect(product.tags[0].color).toBe('#00FF00');

            // Verify Task-Tag Association
            expect(product.tasks.length).toBe(1);
            expect(product.tasks[0].name).toBe('Task with Tag');
            expect(product.tasks[0].taskTags.length).toBe(1);
            expect(product.tasks[0].taskTags[0].tag.name).toBe('New Import Tag');
        }
    });
});
