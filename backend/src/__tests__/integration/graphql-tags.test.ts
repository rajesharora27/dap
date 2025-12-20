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

const prisma = new PrismaClient();

describe('GraphQL API - Tags', () => {
    let app: express.Application;
    let server: ApolloServer;
    let authToken: string;
    let testUser: any;

    beforeAll(async () => {
        // Create Express app
        app = express();
        app.use(express.json());

        // Create Apollo Server
        const schema = makeExecutableSchema({ typeDefs, resolvers });
        server = new ApolloServer({ schema });
        await server.start();

        // Add GraphQL middleware
        app.use('/graphql', expressMiddleware(server, {
            context: async ({ req }: { req: express.Request }) => ({
                user: req.headers.authorization ? { id: testUser?.id, userId: testUser?.id } : null,
                prisma
            })
        }));

        // Create test user with unique email for this test file
        testUser = await TestFactory.createUser({
            email: 'tagtest@example.com',
            username: 'tagtest',
            role: 'ADMIN',
            isAdmin: true
        });

        authToken = jwt.sign(
            { userId: testUser.id },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    });

    beforeEach(async () => {
        await TestFactory.cleanup();
    });

    afterAll(async () => {
        await TestFactory.cleanup();
        await server.stop();
        await prisma.$disconnect();
    });

    describe('ProductTag Operations', () => {
        it('should create a new product tag', async () => {
            const product = await TestFactory.createProduct({ name: 'Tag Product' });

            const response = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: `
            mutation CreateProductTag($input: ProductTagInput!) {
              createProductTag(input: $input) {
                id
                name
                color
                productId
                displayOrder
              }
            }
          `,
                    variables: {
                        input: {
                            productId: product.id,
                            name: 'Feature Tag',
                            color: '#FF0000',
                            displayOrder: 1
                        }
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.errors).toBeUndefined();
            const tag = response.body.data.createProductTag;
            expect(tag.name).toBe('Feature Tag');
            expect(tag.color).toBe('#FF0000');
            expect(tag.productId).toBe(product.id);
        });

        it('should update an existing product tag', async () => {
            const product = await TestFactory.createProduct({ name: 'Update Tag Product' });
            const tag = await TestFactory.createProductTag(product.id, { name: 'Old Tag' });

            const response = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: `
            mutation UpdateProductTag($id: ID!, $input: ProductTagUpdateInput!) {
              updateProductTag(id: $id, input: $input) {
                id
                name
                color
              }
            }
          `,
                    variables: {
                        id: tag.id,
                        input: {
                            name: 'New Tag Name',
                            color: '#00FF00'
                        }
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.errors).toBeUndefined();
            const updatedTag = response.body.data.updateProductTag;
            expect(updatedTag.name).toBe('New Tag Name');
            expect(updatedTag.color).toBe('#00FF00');
        });

        it('should delete a product tag', async () => {
            const product = await TestFactory.createProduct({ name: 'Delete Tag Product' });
            const tag = await TestFactory.createProductTag(product.id);

            const response = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: `
            mutation DeleteProductTag($id: ID!) {
              deleteProductTag(id: $id)
            }
          `,
                    variables: {
                        id: tag.id
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.errors).toBeUndefined();
            expect(response.body.data.deleteProductTag).toBe(true);

            const deletedTag = await prisma.productTag.findUnique({ where: { id: tag.id } });
            expect(deletedTag).toBeNull();
        });

        it('should query product tags for a product', async () => {
            const product = await TestFactory.createProduct({ name: 'Query Tag Product' });
            await TestFactory.createProductTag(product.id, { name: 'Tag 1', displayOrder: 1 });
            await TestFactory.createProductTag(product.id, { name: 'Tag 2', displayOrder: 2 });

            const response = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: `
            query ProductTags($productId: ID!) {
              productTags(productId: $productId) {
                id
                name
                displayOrder
              }
            }
          `,
                    variables: {
                        productId: product.id
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.errors).toBeUndefined();
            const tags = response.body.data.productTags;
            expect(tags).toHaveLength(2);
            expect(tags.map((t: any) => t.name).sort()).toEqual(['Tag 1', 'Tag 2']);
        });
    });

    describe('SolutionTag Operations', () => {
        it('should create and query solution tags', async () => {
            const solution = await TestFactory.createSolution({ name: 'Tag Solution' });

            // Create Tag
            await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: `
            mutation CreateSolutionTag($input: SolutionTagInput!) {
              createSolutionTag(input: $input) {
                id
              }
            }
          `,
                    variables: {
                        input: {
                            solutionId: solution.id,
                            name: 'Sol Tag',
                            color: '#0000FF',
                            displayOrder: 1
                        }
                    }
                });

            // Query Tags
            const response = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: `
            query SolutionTags($solutionId: ID!) {
              solutionTags(solutionId: $solutionId) {
                id
                name
              }
            }
          `,
                    variables: {
                        solutionId: solution.id
                    }
                });

            expect(response.body.data.solutionTags).toHaveLength(1);
            expect(response.body.data.solutionTags[0].name).toBe('Sol Tag');
        });
    });
});
