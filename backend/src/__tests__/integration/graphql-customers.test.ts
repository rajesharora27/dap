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
describe.skip('GraphQL API - Customers', () => {
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

        it('should return customer with products', async () => {
            const customer = await TestFactory.createCustomer();
            const product = await TestFactory.createProduct();

            // Create CustomerProduct relationship (new schema)
            await prisma.customerProduct.create({
                data: {
                    customerId: customer.id,
                    productId: product.id,
                    name: 'Test Product Assignment',
                    licenseLevel: 'ESSENTIAL'
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
                products {
                  id
                  name
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
            expect(customerData.products).toBeDefined();
            expect(customerData.products.length).toBeGreaterThan(0);
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

    describe('Customer Products', () => {
        it('should assign product to customer', async () => {
            const customer = await TestFactory.createCustomer();
            const product = await TestFactory.createProduct();

            // Create customer product assignment directly
            const customerProduct = await prisma.customerProduct.create({
                data: {
                    customerId: customer.id,
                    productId: product.id,
                    name: 'Primary Product',
                    licenseLevel: 'ESSENTIAL'
                }
            });

            expect(customerProduct).toBeDefined();
            expect(customerProduct.customerId).toBe(customer.id);
            expect(customerProduct.productId).toBe(product.id);
        });

        it('should create adoption plan for customer product', async () => {
            const customer = await TestFactory.createCustomer();
            const product = await TestFactory.createProduct();

            // First create a customer product
            const customerProduct = await prisma.customerProduct.create({
                data: {
                    customerId: customer.id,
                    productId: product.id,
                    name: 'Test Assignment',
                    licenseLevel: 'ESSENTIAL'
                }
            });

            // Then create adoption plan linked to customer product (new schema)
            const adoptionPlan = await prisma.adoptionPlan.create({
                data: {
                    customerProductId: customerProduct.id,
                    productId: product.id,
                    productName: product.name,
                    licenseLevel: 'ESSENTIAL',
                    totalTasks: 0,
                    completedTasks: 0
                }
            });

            expect(adoptionPlan).toBeDefined();
            expect(adoptionPlan.customerProductId).toBe(customerProduct.id);
            expect(adoptionPlan.productId).toBe(product.id);
        });
    });
});
