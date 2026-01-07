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
import { SettingsService } from '../../modules/settings/settings.service';
import { clearSettingsCache } from '../../config/settings-provider';

const prisma = new PrismaClient();

describe('GraphQL API - Admin Settings', () => {
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
                    // Mock context user
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

        // Seed settings
        await SettingsService.seedInitialSettings();

        // Clear caches to ensure fresh state
        SettingsService.clearCache();
        clearSettingsCache();

        adminUser = await TestFactory.createUser({
            email: 'admin-settings@example.com',
            username: 'admin-settings',
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

    it('queries all settings successfully', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
          query AppSettings {
            appSettings {
              key
              value
              category
              label
            }
          }
        `,
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.appSettings.length).toBeGreaterThan(0);

        // Check for specific seeded settings
        const settings = response.body.data.appSettings;
        expect(settings.find((s: any) => s.key === 'ai.enabled')).toBeDefined();
        expect(settings.find((s: any) => s.key === 'session.timeout.ms')).toBeDefined();
    });

    it('queries settings filtered by category', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
          query AppSettings($category: String) {
            appSettings(category: $category) {
              key
              category
            }
          }
        `,
                variables: { category: 'security' }
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        const settings = response.body.data.appSettings;
        expect(settings.length).toBeGreaterThan(0);
        settings.forEach((s: any) => {
            expect(s.category).toBe('security');
        });

        // Should not include AI settings
        expect(settings.find((s: any) => s.key === 'ai.enabled')).toBeUndefined();
    });

    it('updates a setting value and reflects in query', async () => {
        // 1. Update setting
        const updateResponse = await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
          mutation UpdateSetting($input: UpdateSettingInput!) {
            updateSetting(input: $input) {
              key
              value
              updatedBy
            }
          }
        `,
                variables: {
                    input: {
                        key: 'ai.enabled',
                        value: 'true'
                    }
                }
            });

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.errors).toBeUndefined();
        expect(updateResponse.body.data.updateSetting.value).toBe('true');
        expect(updateResponse.body.data.updateSetting.updatedBy).toBe(adminUser.id);

        // 2. Query to verify persistence
        const queryResponse = await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
          query GetSetting($key: String!) {
            appSetting(key: $key) {
              key
              value
            }
          }
        `,
                variables: { key: 'ai.enabled' }
            });

        expect(queryResponse.body.data.appSetting.value).toBe('true');
    });

    it('updates to settings affect AI availability (Runtime Behavior)', async () => {
        // 1. Ensure AI is disabled initially (default is false)
        const check1 = await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
          query {
             isAIAgentAvailable {
               available
               message
             }
          }
        `
            });

        // Default is 'false' in seed, so should be available=false due to our check
        // Wait, logic in resolver: if (!isEnabled) return available: false.
        // If seeded default is 'false', then it should return false.
        expect(check1.body.data.isAIAgentAvailable.available).toBe(false);
        expect(check1.body.data.isAIAgentAvailable.message).toContain('disabled');

        // 2. Enable AI via setting
        await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
          mutation UpdateSetting($input: UpdateSettingInput!) {
            updateSetting(input: $input) { key }
          }
        `,
                variables: {
                    input: { key: 'ai.enabled', value: 'true' }
                }
            });

        // 3. Verify AI is now available
        const check2 = await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
          query {
             isAIAgentAvailable {
               available
               message
             }
          }
        `
            });

        expect(check2.body.data.isAIAgentAvailable.available).toBe(true);
        expect(check2.body.data.isAIAgentAvailable.message).toContain('available');
    });

    it('resets a setting to default value', async () => {
        // 1. Change to non-default
        await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
          mutation UpdateSetting($input: UpdateSettingInput!) {
            updateSetting(input: $input) { key }
          }
        `,
                variables: {
                    input: { key: 'session.timeout.ms', value: '999999' }
                }
            });

        // 2. Reset
        const resetResponse = await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
          mutation ResetSetting($key: String!) {
            resetSetting(key: $key) {
              key
              value
            }
          }
        `,
                variables: { key: 'session.timeout.ms' }
            });

        expect(resetResponse.body.data.resetSetting.value).toBe('1800000'); // Default value
    });

    it('logs audit entry for setting update', async () => {
        // 1. Update setting
        await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
          mutation UpdateSetting($input: UpdateSettingInput!) {
            updateSetting(input: $input) { key }
          }
        `,
                variables: {
                    input: { key: 'ui.items.per.page', value: '50' }
                }
            });

        // 2. Check audit log
        const logs = await prisma.auditLog.findMany({
            where: {
                action: 'UPDATE_SETTING',
                entity: 'AppSetting',
            },
            orderBy: { createdAt: 'desc' }
        });

        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0].details).toMatchObject({
            key: 'ui.items.per.page',
            after: '50'
        });
        expect(logs[0].userId).toBe(adminUser.id);
    });

    it('validates input types correctly', async () => {
        // Try to set boolean setting to invalid string
        const response = await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
          mutation UpdateSetting($input: UpdateSettingInput!) {
            updateSetting(input: $input) { key }
          }
        `,
                variables: {
                    input: { key: 'ai.enabled', value: 'not-a-boolean' }
                }
            });

        expect(response.status).toBe(200); // GraphQL returns 200 even on error usually
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain('Invalid boolean value');
    });

    it('returns correct error structure when AI is disabled', async () => {
        // 1. Ensure AI is disabled
        await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
          mutation UpdateSetting($input: UpdateSettingInput!) {
            updateSetting(input: $input) { key }
          }
        `,
                variables: {
                    input: { key: 'ai.enabled', value: 'false' }
                }
            });

        // 2. Ask AI
        const response = await request(app)
            .post('/graphql')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                query: `
          query AskAI($question: String!) {
            askAI(question: $question) {
              answer
              data
              error
              metadata {
                executionTime
                rowCount
                truncated
                cached
              }
            }
          }
        `,
                variables: {
                    question: 'Hello'
                }
            });

        expect(response.status).toBe(200);
        // Should NOT have GraphQL validation errors
        expect(response.body.errors).toBeUndefined();

        const result = response.body.data.askAI;
        expect(result.error).toBe('AI_DISABLED');
        expect(result.data).toBeNull();
        expect(result.answer).toContain('disabled');
        // Verify metadata fields are present (not null)
        expect(result.metadata).toBeDefined();
        expect(result.metadata.executionTime).toBe(0);
        expect(result.metadata.rowCount).toBe(0);
    });
});
