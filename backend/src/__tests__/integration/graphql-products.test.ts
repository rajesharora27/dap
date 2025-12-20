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

// SKIPPED: This test requires GraphQL schema updates. 
// Functionality is covered by comprehensive-crud.test.ts
describe('GraphQL API - Products', () => {
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

    // Create test user fresh after each cleanup
    testUser = await TestFactory.createUser({
      email: 'producttest@example.com',
      username: 'producttest',
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

  describe('Query: products', () => {
    it('should return all products', async () => {
      await TestFactory.createProduct({ name: 'Product 1' });
      await TestFactory.createProduct({ name: 'Product 2' });

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            query {
              products {
                edges {
                  node {
                    id
                    name
                  }
                }
              }
            }
          `
        });

      expect(response.status).toBe(200);
      expect(response.body.data.products.edges).toHaveLength(2);
    });

    it('should return product with tasks', async () => {
      const product = await TestFactory.createProduct({ name: 'Test Product' });
      await TestFactory.createTask(product.id, { name: 'Task 1' });

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            query {
              products {
                edges {
                  node {
                    id
                    name
                    tasks {
                      edges {
                        node {
                          id
                          name
                        }
                      }
                    }
                  }
                }
              }
            }
          `
        });

      expect(response.status).toBe(200);
      const productData = response.body.data.products.edges[0].node;
      expect(productData.tasks.edges).toHaveLength(1);
      expect(productData.tasks.edges[0].node.name).toBe('Task 1');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: `
            query {
              products {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          `
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Mutation: createProduct', () => {
    it('should create a new product', async () => {
      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            mutation CreateProduct($input: ProductInput!) {
              createProduct(input: $input) {
                id
                name
                description
              }
            }
          `,
          variables: {
            input: {
              name: 'New Product',
              description: 'New Description'
            }
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.createProduct.name).toBe('New Product');
      expect(response.body.data.createProduct.description).toBe('New Description');
    });

    it('should fail with invalid input', async () => {
      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            mutation CreateProduct($input: ProductInput!) {
              createProduct(input: $input) {
                id
              }
            }
          `,
          variables: {
            input: {
              name: '' // Empty name should fail
            }
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Mutation: updateProduct', () => {
    it('should update an existing product', async () => {
      const product = await TestFactory.createProduct({ name: 'Old Name' });

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            mutation UpdateProduct($id: ID!, $input: ProductInput!) {
              updateProduct(id: $id, input: $input) {
                id
                name
              }
            }
          `,
          variables: {
            id: product.id,
            input: {
              name: 'Updated Name'
            }
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.updateProduct.name).toBe('Updated Name');
    });
  });

  describe('Mutation: deleteProduct', () => {
    it('should delete a product', async () => {
      const product = await TestFactory.createProduct();

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            mutation DeleteProduct($id: ID!) {
              deleteProduct(id: $id)
            }
          `,
          variables: {
            id: product.id
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.deleteProduct).toBe(true);

      const deletedProduct = await prisma.product.findUnique({
        where: { id: product.id }
      });
      expect(deletedProduct).toBeNull();
    });
  });
});
