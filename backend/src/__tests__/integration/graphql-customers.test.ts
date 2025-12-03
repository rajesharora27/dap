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

describe('GraphQL API - Customers', () => {
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
            context: async ({ req }: { req: express.Request }) => ({
                user: req.headers.authorization ? { id: testUser?.id, userId: testUser?.id } : null,
                prisma
            })
        }));

        testUser = await TestFactory.createUser({
            email: 'customertest@example.com',
            username: 'customertest',
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

    describe('Query: customers', () => {
        it('should return all customers', async () => {
            await TestFactory.createCustomer({ name: 'Customer 1' });
            await TestFactory.createCustomer({ name: 'Customer 2' });

            const response = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: `
            query {
              customers {
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
            expect(response.body.data.customers.edges.length).toBeGreaterThanOrEqual(2);
        });

        it('should return customer with adoption plans', async () => {
            const customer = await TestFactory.createCustomer();
            const product = await TestFactory.createProduct();

            await prisma.adoptionPlan.create({
                data: {
                    customerId: customer.id,
                    productId: product.id,
                    status: 'IN_PROGRESS'
                }
            });

            const response = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: `
            query GetCustomer($id: ID!) {
              customer(id: $id) {
                id
                name
                adoptionPlans {
                  id
                  status
                  product {
                    id
                    name
                  }
                }
              }
            }
          `,
                    variables: { id: customer.id }
                });

            expect(response.status).toBe(200);
            const customerData = response.body.data.customer;
            expect(customerData.adoptionPlans).toBeDefined();
            expect(customerData.adoptionPlans.length).toBeGreaterThan(0);
        });
    });

    describe('Mutation: createCustomer', () => {
        it('should create a new customer', async () => {
            const response = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: `
            mutation CreateCustomer($input: CreateCustomerInput!) {
              createCustomer(input: $input) {
                id
                name
                description
              }
            }
          `,
                    variables: {
                        input: {
                            name: 'GraphQL Test Customer',
                            description: 'Created via GraphQL'
                        }
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.data.createCustomer.name).toBe('GraphQL Test Customer');
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: `
            mutation CreateCustomer($input: CreateCustomerInput!) {
              createCustomer(input: $input) {
                id
              }
            }
          `,
                    variables: {
                        input: {
                            name: ''
                        }
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.errors).toBeDefined();
        });
    });

    describe('Mutation: updateCustomer', () => {
        it('should update customer', async () => {
            const customer = await TestFactory.createCustomer({ name: 'Old Name' });

            const response = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: `
            mutation UpdateCustomer($id: ID!, $input: UpdateCustomerInput!) {
              updateCustomer(id: $id, input: $input) {
                id
                name
                description
              }
            }
          `,
                    variables: {
                        id: customer.id,
                        input: {
                            name: 'Updated Name',
                            description: 'Updated Description'
                        }
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.data.updateCustomer.name).toBe('Updated Name');
        });
    });

    describe('Mutation: deleteCustomer', () => {
        it('should delete customer', async () => {
            const customer = await TestFactory.createCustomer();

            const response = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: `
            mutation DeleteCustomer($id: ID!) {
              deleteCustomer(id: $id)
            }
          `,
                    variables: { id: customer.id }
                });

            expect(response.status).toBe(200);
            expect(response.body.data.deleteCustomer).toBe(true);

            const deleted = await prisma.customer.findUnique({
                where: { id: customer.id }
            });
            expect(deleted).toBeNull();
        });
    });

    describe('Adoption Plans', () => {
        it('should create adoption plan for customer', async () => {
            const customer = await TestFactory.createCustomer();
            const product = await TestFactory.createProduct();

            const response = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: `
            mutation CreateAdoptionPlan($input: CreateAdoptionPlanInput!) {
              createAdoptionPlan(input: $input) {
                id
                customerId
                productId
                status
              }
            }
          `,
                    variables: {
                        input: {
                            customerId: customer.id,
                            productId: product.id,
                            status: 'IN_PROGRESS'
                        }
                    }
                });

            expect(response.status).toBe(200);
            const plan = response.body.data.createAdoptionPlan;
            expect(plan.customerId).toBe(customer.id);
            expect(plan.productId).toBe(product.id);
        });

        it('should track adoption task progress', async () => {
            const customer = await TestFactory.createCustomer();
            const product = await TestFactory.createProduct();
            const task = await TestFactory.createTask(product.id);

            const adoptionPlan = await prisma.adoptionPlan.create({
                data: {
                    customerId: customer.id,
                    productId: product.id,
                    status: 'IN_PROGRESS'
                }
            });

            const response = await request(app)
                .post('/graphql')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: `
            mutation UpdateAdoptionTask($input: UpdateAdoptionTaskInput!) {
              updateAdoptionTask(input: $input) {
                id
                status
              }
            }
          `,
                    variables: {
                        input: {
                            adoptionPlanId: adoptionPlan.id,
                            taskId: task.id,
                            status: 'DONE'
                        }
                    }
                });

            expect(response.status).toBe(200);
            const adoptionTask = response.body.data.updateAdoptionTask;
            expect(adoptionTask.status).toBe('DONE');
        });
    });
});
