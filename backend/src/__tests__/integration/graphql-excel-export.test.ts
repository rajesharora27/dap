
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

describe('GraphQL API - Excel Export Integration', () => {
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
                    productRefs: [], // Added for Solution Export/Import
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
            email: 'exporttest@example.com',
            username: 'exporttest',
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

    it('should export product to Excel with correct Tags data via GraphQL', async () => {
        // 1. Setup Data
        const product = await TestFactory.createProduct({ name: 'Export Tags Test Product' });

        // Create Tag
        const tag = await prisma.productTag.create({
            data: {
                name: 'Critical Feature',
                color: '#FF0000',
                displayOrder: 1,
                productId: product.id
            }
        });

        // Create Task linked to Tag
        const task = await TestFactory.createTask(product.id, { name: 'Important Task' });
        await prisma.taskTag.create({
            data: {
                taskId: task.id,
                tagId: tag.id
            }
        });

        // 2. Execute GraphQL Query
        const response = await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
          query ExportProductToExcel($productId: ID!) {
            exportProduct(productId: $productId) {
              filename
              content
              mimeType
              size
            }
          }
        `,
                variables: {
                    productId: product.id
                }
            });

        // 3. Verify Response Structure
        expect(response.status).toBe(200);
        const data = response.body.data.exportProduct;
        expect(data).toBeDefined();
        expect(data.filename).toContain('Export Tags Test Product');
        expect(data.content).toBeDefined();

        // 4. Decode and Verify Excel Content
        const buffer = Buffer.from(data.content, 'base64');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        // Check "Tags" sheet
        const tagsSheet = workbook.getWorksheet('Tags');
        expect(tagsSheet).toBeDefined();
        if (tagsSheet) {
            expect(tagsSheet.rowCount).toBeGreaterThan(1); // Header + 1 row
            const firstTag = tagsSheet.getRow(2).getCell(2).value;
            expect(firstTag).toBe('Critical Feature');
        }

        // Check "Tasks" sheet has "Tags" column
        const tasksSheet = workbook.getWorksheet('Tasks');
        expect(tasksSheet).toBeDefined();
        if (tasksSheet) {
            const headerRow = tasksSheet.getRow(1);
            let tagsColIndex = -1;
            headerRow.eachCell((cell, colNumber) => {
                if (cell.value === 'Tags') tagsColIndex = colNumber;
            });
            expect(tagsColIndex).toBeGreaterThan(-1);

            // Check Task row data
            const taskRow = tasksSheet.getRow(2);
            const tagValue = taskRow.getCell(tagsColIndex).value;
            expect(tagValue).toBe('Critical Feature');
        }

        // Check Instructions
        const instrSheet = workbook.getWorksheet('Instructions');
        expect(instrSheet).toBeDefined();
    });
});
