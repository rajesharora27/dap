
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
        infoSheet.addRow(['Field', 'Value']);
        infoSheet.addRow(['Product Name', 'Imported Tags Product']);
        infoSheet.addRow(['Description', 'Test product for tags import']);

        // Tags Sheet (Crucial)
        const tagsSheet = workbook.addWorksheet('Tags');
        tagsSheet.addRow(['Tag Name', 'Color', 'Display Order']);
        tagsSheet.addRow(['New Import Tag', '#00FF00', 1]);

        // Tasks Sheet (Assigning the tag)
        const tasksSheet = workbook.addWorksheet('Tasks');
        tasksSheet.addRow(['Task Name', 'Description', 'Sequence Number', 'License Level', 'Weight', 'Estimated Minutes', 'Tags']);
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

        // 2. Execute GraphQL Mutation
        const response = await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
          mutation ImportProductFromExcel($content: String!, $mode: ImportMode!) {
            importProductFromExcel(content: $content, mode: $mode) {
              success
              productName
              productId
              stats {
                tagsImported
                tasksImported
              }
              errors {
                message
                sheet
              }
            }
          }
        `,
                variables: {
                    content: base64Content,
                    mode: 'CREATE_NEW'
                }
            });

        // 3. Verify Response
        if (response.status !== 200) {
            console.error('Response Status:', response.status);
            console.error('Response Body:', JSON.stringify(response.body, null, 2));
        }
        expect(response.status).toBe(200);
        const result = response.body.data.importProductFromExcel;
        if (result.errors && result.errors.length > 0) {
            console.error('Import Errors:', result.errors);
        }
        expect(result.success).toBe(true);
        expect(result.stats.tagsImported).toBe(1);
        expect(result.stats.tasksImported).toBe(1);

        // 4. Verify Database State
        const product = await prisma.product.findUnique({
            where: { id: result.productId },
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
