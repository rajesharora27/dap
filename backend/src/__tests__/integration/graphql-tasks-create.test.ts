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

describe('GraphQL API - Tasks (createTask)', () => {
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
      email: 'tasktest@example.com',
      username: 'tasktest',
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

  it('creates a Product task when licenseId is provided (maps to licenseLevel)', async () => {
    const product = await TestFactory.createProduct({ name: 'Task Product' });
    const license = await prisma.license.create({
      data: {
        productId: product.id,
        name: 'Essential',
        description: 'Essential license',
        level: 1,
        isActive: true
      }
    });

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          mutation CreateTask($input: TaskCreateInput!) {
            createTask(input: $input) {
              id
              name
              estMinutes
              weight
              licenseLevel
              license { id level }
              product { id }
            }
          }
        `,
        variables: {
          input: {
            productId: product.id,
            name: 'My Task',
            estMinutes: 60,
            weight: 1,
            licenseId: license.id
          }
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createTask.product.id).toBe(product.id);
    expect(response.body.data.createTask.licenseLevel).toBe('Essential');
    expect(response.body.data.createTask.license.id).toBe(license.id);
    expect(response.body.data.createTask.license.level).toBe(1);
  });

  it('creates a Solution task when licenseId is provided (maps to licenseLevel)', async () => {
    const solution = await TestFactory.createSolution({ name: 'Task Solution' });
    const license = await prisma.license.create({
      data: {
        solutionId: solution.id,
        name: 'Advantage',
        description: 'Advantage license',
        level: 2,
        isActive: true
      }
    });

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          mutation CreateTask($input: TaskCreateInput!) {
            createTask(input: $input) {
              id
              name
              estMinutes
              weight
              licenseLevel
              license { id level }
              solution { id }
            }
          }
        `,
        variables: {
          input: {
            solutionId: solution.id,
            name: 'My Solution Task',
            estMinutes: 30,
            weight: 5,
            licenseId: license.id
          }
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createTask.solution.id).toBe(solution.id);
    expect(response.body.data.createTask.licenseLevel).toBe('Advantage');
    expect(response.body.data.createTask.license.id).toBe(license.id);
    expect(response.body.data.createTask.license.level).toBe(2);
  });
});


