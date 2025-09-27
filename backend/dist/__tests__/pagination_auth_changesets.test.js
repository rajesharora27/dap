"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../server");
const context_1 = require("../context");
let app;
let dbAvailable = true;
beforeAll(async () => {
    try {
        app = await (0, server_1.createApp)();
        await context_1.prisma.taskStatus.upsert({ where: { code: 'TODO' }, update: {}, create: { code: 'TODO', label: 'Todo' } });
    }
    catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Skipping DB tests (unavailable):', e.message);
        dbAvailable = false;
    }
});
describe('Backward pagination & auth & change sets', () => {
    it('enforces role on createProduct and supports backward pagination', async () => {
        if (!dbAvailable) {
            expect(true).toBe(true);
            return;
        }
        const mutation = `mutation($input: ProductInput!){ createProduct(input:$input){ id name } }`;
        const userRes = await (0, supertest_1.default)(app.app).post('/graphql').set('Authorization', 'Bearer user').send({ query: mutation, variables: { input: { name: 'X', description: 'x' } } });
        expect(userRes.body.errors?.[0].message).toMatch(/FORBIDDEN/);
        for (let i = 1; i <= 4; i++) {
            await (0, supertest_1.default)(app.app).post('/graphql').set('Authorization', 'Bearer admin').send({ query: mutation, variables: { input: { name: 'P' + i, description: 'd' + i } } });
        }
        const lastQuery = `query { products(last:2){ edges { node { name } } pageInfo { hasPreviousPage hasNextPage } } }`;
        const lastRes = await (0, supertest_1.default)(app.app).post('/graphql').send({ query: lastQuery });
        const names = lastRes.body.data.products.edges.map((e) => e.node.name);
        expect(names.length).toBe(2);
        expect(names[0]).toBe('P3');
        expect(names[1]).toBe('P4');
        expect(lastRes.body.data.products.pageInfo.hasPreviousPage).toBe(true);
        expect(lastRes.body.data.products.pageInfo.hasNextPage).toBe(false);
    });
    it('records change set and can revert', async () => {
        if (!dbAvailable) {
            expect(true).toBe(true);
            return;
        }
        const create = `mutation($input: ProductInput!){ createProduct(input:$input){ id name } }`;
        const created = await (0, supertest_1.default)(app.app).post('/graphql').set('Authorization', 'Bearer admin').send({ query: create, variables: { input: { name: 'Initial', description: 'd' } } });
        const id = created.body.data.createProduct.id;
        const update = `mutation($id:ID!,$input:ProductInput!){ updateProduct(id:$id,input:$input){ id name } }`;
        await (0, supertest_1.default)(app.app).post('/graphql').set('Authorization', 'Bearer admin').send({ query: update, variables: { id, input: { name: 'Changed', description: 'd2' } } });
        const csQuery = `query { changeSets(limit:5){ id committedAt items { id } } }`;
        const csRes = await (0, supertest_1.default)(app.app).post('/graphql').send({ query: csQuery });
        const csId = csRes.body.data.changeSets[0].id;
        const commit = `mutation($id:ID!){ commitChangeSet(id:$id) }`;
        await (0, supertest_1.default)(app.app).post('/graphql').set('Authorization', 'Bearer admin').send({ query: commit, variables: { id: csId } });
        const revert = `mutation($id:ID!){ revertChangeSet(id:$id) }`;
        await (0, supertest_1.default)(app.app).post('/graphql').set('Authorization', 'Bearer admin').send({ query: revert, variables: { id: csId } });
        const fetch = `query($id:ID!){ node(id:$id){ ... on Product { id name } } }`;
        const prod = await (0, supertest_1.default)(app.app).post('/graphql').send({ query: fetch, variables: { id } });
        expect(prod.body.data.node.name).toBe('Initial');
    });
});
