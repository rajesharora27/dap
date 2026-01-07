import request from 'supertest';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { typeDefs } from '../../schema/typeDefs';
import { resolvers } from '../../schema/resolvers';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { TestFactory } from '../factories/TestFactory';
import { PrismaClient, PermissionLevel, ResourceType } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('GraphQL API - RBAC enforcement (real resolver path)', () => {
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
    await TestFactory.cleanup();

    testUser = await TestFactory.createUser({
      email: 'rbac-user@example.com',
      username: 'rbac-user',
      role: 'USER',
      isAdmin: false,
    });

    authToken = jwt.sign({ userId: testUser.id }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1h',
    });
  });

  afterAll(async () => {
    await TestFactory.cleanup();
    await server.stop();
    await prisma.$disconnect();
  });

  it('denies createProduct without PRODUCT WRITE (type-level) permission', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          mutation CreateProduct($input: ProductInput!) {
            createProduct(input: $input) {
              id
              name
            }
          }
        `,
        variables: {
          input: {
            name: 'RBAC Product',
            description: 'Should be forbidden without write',
            resources: [],
            customAttrs: {},
          },
        },
      });

    // Apollo may return 400 for GraphQL execution errors depending on server config.
    expect([200, 400]).toContain(response.status);
    expect(response.body.data?.createProduct ?? null).toBeNull();
    expect(JSON.stringify(response.body.errors || [])).toContain('WRITE permission');
  });

  it('allows createProduct when user has PRODUCT WRITE (type-level) via RBAC RolePermission', async () => {
    const role = await TestFactory.createRole({ name: 'TEST_PRODUCT_WRITER' });
    await TestFactory.grantRolePermission({
      roleId: role.id,
      resourceType: ResourceType.PRODUCT,
      resourceId: null,
      permissionLevel: PermissionLevel.WRITE,
    });
    await TestFactory.assignRoleToUser({ userId: testUser.id, roleId: role.id });

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          mutation CreateProduct($input: ProductInput!) {
            createProduct(input: $input) {
              id
              name
            }
          }
        `,
        variables: {
          input: {
            name: 'RBAC Product Allowed',
            description: 'Created by USER with RBAC role',
            resources: [],
            customAttrs: {},
          },
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createProduct.name).toBe('RBAC Product Allowed');
  });

  it('products list returns all products for USER (read-only default)', async () => {
    const p1 = await TestFactory.createProduct({ name: 'P1' });
    await TestFactory.createProduct({ name: 'P2' });

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          query Products {
            products {
              edges {
                node { id name }
              }
            }
          }
        `,
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const names = (response.body.data.products.edges || []).map((e: any) => e.node.name);
    // With default USER read-all enabled, USER should see all products.
    expect(names.sort()).toEqual(['P1', 'P2']);
  });
});


