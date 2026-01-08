import request from 'supertest';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { typeDefs } from '../../schema/typeDefs';
import { resolvers } from '../../schema/resolvers';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const prisma = new PrismaClient();

describe('GraphQL API - Personal Sandbox (My Products)', () => {
  let app: express.Application;
  let server: ApolloServer;
  let authToken: string;
  let testUser: any;
  let personalProductId: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    const schema = makeExecutableSchema({ typeDefs, resolvers });
    server = new ApolloServer({ schema });
    await server.start();

    app.use(
      '/graphql',
      expressMiddleware(server, {
        context: async ({ req }: { req: express.Request }) => {
          if (!req.headers.authorization) return { prisma, user: null };
          return {
            prisma,
            user: {
              id: testUser?.id,
              userId: testUser?.id,
              role: testUser?.role,
              isAdmin: testUser?.isAdmin,
            },
          };
        },
      })
    );
  });

  beforeEach(async () => {
    // Create a fresh user + product per test (simpler isolation)
    const now = Date.now();
    const password = crypto.randomBytes(24).toString('hex');
    testUser = await prisma.user.create({
      data: {
        email: `personal-sandbox-${now}@test.com`,
        username: `personal_sandbox_${now}`,
        name: 'Personal Sandbox Test',
        password,
        role: 'USER' as any,
        isAdmin: false,
      },
    });

    personalProductId = (
      await prisma.personalProduct.create({
        data: {
          userId: testUser.id,
          name: `My Product ${now}`,
          description: 'Personal sandbox product',
        },
      })
    ).id;

    authToken = jwt.sign({ userId: testUser.id }, process.env.JWT_SECRET as string, {
      expiresIn: '1h',
    });
  });

  afterEach(async () => {
    // Cascade deletes personal sandbox data
    if (testUser?.id) {
      await prisma.user.delete({ where: { id: testUser.id } });
    }
  });

  afterAll(async () => {
    await server.stop();
    await prisma.$disconnect();
  });

  it('accepts howToDoc/howToVideo/licenseLevel in createPersonalTask + updatePersonalTask (prevents My Products save 400s)', async () => {
    const createResp = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          mutation CreatePersonalTask($input: CreatePersonalTaskInput!) {
            createPersonalTask(input: $input) {
              id
              name
              howToDoc
              howToVideo
              licenseLevel
            }
          }
        `,
        variables: {
          input: {
            personalProductId,
            name: 'Task 1',
            estMinutes: 30,
            weight: 1,
            howToDoc: ['https://example.com/doc'],
            howToVideo: ['https://example.com/video'],
            licenseLevel: 2,
          },
        },
      });

    expect(createResp.status).toBe(200);
    expect(createResp.body.errors).toBeUndefined();
    expect(createResp.body.data.createPersonalTask.name).toBe('Task 1');
    expect(createResp.body.data.createPersonalTask.howToDoc).toEqual(['https://example.com/doc']);
    expect(createResp.body.data.createPersonalTask.howToVideo).toEqual(['https://example.com/video']);
    expect(createResp.body.data.createPersonalTask.licenseLevel).toBe(2);

    const taskId = createResp.body.data.createPersonalTask.id;

    const updateResp = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          mutation UpdatePersonalTask($id: ID!, $input: UpdatePersonalTaskInput!) {
            updatePersonalTask(id: $id, input: $input) {
              id
              howToDoc
              howToVideo
              licenseLevel
            }
          }
        `,
        variables: {
          id: taskId,
          input: {
            howToDoc: ['https://example.com/doc-2'],
            howToVideo: [],
            licenseLevel: 3,
          },
        },
      });

    expect(updateResp.status).toBe(200);
    expect(updateResp.body.errors).toBeUndefined();
    expect(updateResp.body.data.updatePersonalTask.howToDoc).toEqual(['https://example.com/doc-2']);
    expect(updateResp.body.data.updatePersonalTask.howToVideo).toEqual([]);
    expect(updateResp.body.data.updatePersonalTask.licenseLevel).toBe(3);
  });
});


