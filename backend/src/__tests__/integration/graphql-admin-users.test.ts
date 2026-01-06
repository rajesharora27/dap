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

describe('GraphQL API - Admin Users (contract + safety)', () => {
  let app: express.Application;
  let server: ApolloServer;
  let authToken: string;
  let adminUser: any;

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
              id: adminUser?.id,
              userId: adminUser?.id,
              role: adminUser?.role,
              isAdmin: adminUser?.isAdmin,
            },
          };
        },
      })
    );
  });

  beforeEach(async () => {
    await TestFactory.cleanup();

    adminUser = await TestFactory.createUser({
      email: 'admin-users@example.com',
      username: 'admin-users',
      role: 'ADMIN',
      isAdmin: true,
    });

    authToken = jwt.sign({ userId: adminUser.id }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1h',
    });
  });

  afterAll(async () => {
    await TestFactory.cleanup();
    await server.stop();
    await prisma.$disconnect();
  });

  it('users query returns non-null role for all users (legacy nulls are coalesced)', async () => {
    await TestFactory.createUser({
      email: 'viewer@example.com',
      username: 'viewer',
      role: 'VIEWER',
      isAdmin: false,
    });

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          query Users {
            users {
              id
              username
              email
              role
              isAdmin
              isActive
            }
          }
        `,
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.users.length).toBeGreaterThanOrEqual(1);
    for (const u of response.body.data.users) {
      expect(u.role).toBeTruthy();
    }
  });

  it('createUser requires password (GraphQL validation)', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) { id }
          }
        `,
        variables: {
          input: {
            username: 'no-pass',
            email: 'no-pass@example.com',
            fullName: 'No Pass',
            role: 'USER',
          },
        },
      });

    // Variable coercion/validation errors are returned as HTTP 400 by our stack
    expect(response.status).toBe(400);
    expect(response.body?.errors?.length).toBeGreaterThan(0);
    expect(JSON.stringify(response.body.errors)).toContain('password');
  });

  it('createUser rejects unknown fields like isAdmin (GraphQL validation)', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) { id }
          }
        `,
        variables: {
          input: {
            username: 'bad-field',
            email: 'bad-field@example.com',
            fullName: 'Bad Field',
            password: 'TempPass123!',
            isAdmin: false,
          },
        },
      });

    expect(response.status).toBe(400);
    expect(response.body?.errors?.length).toBeGreaterThan(0);
    expect(JSON.stringify(response.body.errors)).toContain('isAdmin');
  });

  it('createUser succeeds with role VIEWER and returns role + mustChangePassword', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
              username
              email
              role
              isAdmin
              mustChangePassword
            }
          }
        `,
        variables: {
          input: {
            username: 'new-viewer',
            email: 'new-viewer@example.com',
            fullName: 'New Viewer',
            password: 'TempPass123!',
            role: 'VIEWER',
          },
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createUser.username).toBe('new-viewer');
    expect(response.body.data.createUser.role).toBe('VIEWER');
    expect(response.body.data.createUser.isAdmin).toBe(false);
    expect(response.body.data.createUser.mustChangePassword).toBe(true);
  });
});


