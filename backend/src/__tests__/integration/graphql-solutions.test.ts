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
describe('GraphQL API - Solutions', () => {
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
      email: 'solutiontest@example.com',
      username: 'solutiontest',
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

  describe('Query: solutions', () => {
    it('should return all solutions', async () => {
      await TestFactory.createSolution({ name: 'Solution 1' });
      await TestFactory.createSolution({ name: 'Solution 2' });

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            query {
              solutions {
                edges {
                  node {
                    id
                    name
                    description
                  }
                }
              }
            }
          `
        });

      expect(response.status).toBe(200);
      expect(response.body.data.solutions.edges.length).toBeGreaterThanOrEqual(2);
    });

    it('should return solution with products', async () => {
      const solution = await TestFactory.createSolution();
      const product1 = await TestFactory.createProduct({ name: 'Product 1' });
      const product2 = await TestFactory.createProduct({ name: 'Product 2' });

      // Use solutionProduct (correct model name per schema)
      await prisma.solutionProduct.create({
        data: { solutionId: solution.id, productId: product1.id, order: 1 }
      });
      await prisma.solutionProduct.create({
        data: { solutionId: solution.id, productId: product2.id, order: 2 }
      });

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            query GetSolution($id: ID!) {
              solution(id: $id) {
                id
                name
                products {
                  edges {
                    node {
                      id
                      name
                    }
                  }
                }
              }
            }
          `,
          variables: { id: solution.id }
        });

      expect(response.status).toBe(200);
      const solutionData = response.body.data.solution;
      expect(solutionData.products.edges.length).toBe(2);
    });
  });

  describe('Mutation: createSolution', () => {
    it('should create a new solution', async () => {
      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            mutation CreateSolution($input: SolutionInput!) {
              createSolution(input: $input) {
                id
                name
                description
              }
            }
          `,
          variables: {
            input: {
              name: 'Enterprise Solution',
              description: 'Complete enterprise package'
            }
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.createSolution.name).toBe('Enterprise Solution');
    });
  });

  describe('Mutation: updateSolution', () => {
    it('should update solution', async () => {
      const solution = await TestFactory.createSolution({ name: 'Old Name' });

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            mutation UpdateSolution($id: ID!, $input: SolutionInput!) {
              updateSolution(id: $id, input: $input) {
                id
                name
              }
            }
          `,
          variables: {
            id: solution.id,
            input: { name: 'Updated Solution' }
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.updateSolution.name).toBe('Updated Solution');
    });
  });

  describe('Product Management', () => {
    it('should add product to solution', async () => {
      const solution = await TestFactory.createSolution();
      const product = await TestFactory.createProduct();

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            mutation AddProductToSolution($solutionId: ID!, $productId: ID!) {
              addProductToSolution(solutionId: $solutionId, productId: $productId)
            }
          `,
          variables: {
            solutionId: solution.id,
            productId: product.id
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.addProductToSolution).toBe(true);
    });

    it('should remove product from solution', async () => {
      const solution = await TestFactory.createSolution();
      const product = await TestFactory.createProduct();

      // Use solutionProduct (correct model name)
      await prisma.solutionProduct.create({
        data: { solutionId: solution.id, productId: product.id, order: 1 }
      });

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            mutation RemoveProductFromSolution($solutionId: ID!, $productId: ID!) {
              removeProductFromSolution(solutionId: $solutionId, productId: $productId)
            }
          `,
          variables: {
            solutionId: solution.id,
            productId: product.id
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.removeProductFromSolution).toBe(true);
    });
  });

  describe('Tasks for Solutions', () => {
    it('should query solution tasks', async () => {
      const solution = await TestFactory.createSolution();

      await prisma.task.create({
        data: {
          solutionId: solution.id,
          name: 'Solution Task 1',
          weight: 50,
          sequenceNumber: 1,
          licenseLevel: 'ESSENTIAL',
          estMinutes: 30
        }
      });

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            query GetSolutionTasks($id: ID!) {
              solution(id: $id) {
                id
                tasks {
                  edges {
                    node {
                      id
                      name
                      weight
                    }
                  }
                }
              }
            }
          `,
          variables: { id: solution.id }
        });

      expect(response.status).toBe(200);
      const solutionData = response.body.data.solution;
      expect(solutionData.tasks.edges.length).toBeGreaterThan(0);
    });
  });
});
