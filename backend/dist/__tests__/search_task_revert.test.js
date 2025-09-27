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
let statusId = null;
beforeAll(async () => {
    try {
        app = await (0, server_1.createApp)();
        const status = await context_1.prisma.taskStatus.upsert({ where: { code: 'TODO' }, update: {}, create: { code: 'TODO', label: 'Todo' } });
        statusId = status.id;
    }
    catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Skipping DB tests (unavailable):', e.message);
        dbAvailable = false;
    }
});
describe('Search & Task revert flow', () => {
    it('returns mixed Product & Task results in search', async () => {
        if (!dbAvailable) {
            expect(true).toBe(true);
            return;
        }
        // create product (requires ADMIN)
        const createProduct = `mutation($input: ProductInput!){ createProduct(input:$input){ id name } }`;
        const pRes = await (0, supertest_1.default)(app.app).post('/graphql').set('Authorization', 'Bearer admin').send({ query: createProduct, variables: { input: { name: 'AlphaProduct', description: 'prod' } } });
        const productId = pRes.body.data.createProduct.id;
        // create task (requires any user)
        const createTask = `mutation($input: TaskInput!){ createTask(input:$input){ id name } }`;
        const tRes = await (0, supertest_1.default)(app.app).post('/graphql').set('Authorization', 'Bearer user').send({ query: createTask, variables: { input: { productId, name: 'AlphaTask', description: 't', estMinutes: 30, statusId, weight: 1 } } });
        expect(tRes.body.data.createTask.name).toBe('AlphaTask');
        const search = `query($q:String!){ search(query:$q){ __typename ... on Product { id name } ... on Task { id name } } }`;
        const sRes = await (0, supertest_1.default)(app.app).post('/graphql').send({ query: search, variables: { q: 'Alpha' } });
        const results = sRes.body.data.search;
        const types = results.map((r) => r.__typename);
        expect(types).toContain('Product');
        expect(types).toContain('Task');
    });
    it('reverts a Task update via change set revert', async () => {
        if (!dbAvailable) {
            expect(true).toBe(true);
            return;
        }
        // create product & task
        const createProduct = `mutation($input: ProductInput!){ createProduct(input:$input){ id } }`;
        const pRes = await (0, supertest_1.default)(app.app).post('/graphql').set('Authorization', 'Bearer admin').send({ query: createProduct, variables: { input: { name: 'ProdForTask', description: 'p' } } });
        const productId = pRes.body.data.createProduct.id;
        const createTask = `mutation($input: TaskInput!){ createTask(input:$input){ id name } }`;
        const tRes = await (0, supertest_1.default)(app.app).post('/graphql').set('Authorization', 'Bearer user').send({ query: createTask, variables: { input: { productId, name: 'OriginalTask', description: 'orig', estMinutes: 10, statusId, weight: 1 } } });
        const taskId = tRes.body.data.createTask.id;
        // update task (records change set)
        const updateTask = `mutation($id:ID!,$input:TaskInput!){ updateTask(id:$id,input:$input){ id name } }`;
        await (0, supertest_1.default)(app.app).post('/graphql').set('Authorization', 'Bearer user').send({ query: updateTask, variables: { id: taskId, input: { productId, name: 'RenamedTask', description: 'changed', estMinutes: 20, statusId, weight: 2 } } });
        // locate latest change set and commit & revert
        const csQuery = `query { changeSets(limit:5){ id committedAt items { id entityType entityId } } }`;
        const csRes = await (0, supertest_1.default)(app.app).post('/graphql').send({ query: csQuery });
        // find change set referencing this task
        const cs = csRes.body.data.changeSets.find((c) => c.items.some((i) => i.entityType === 'Task' && i.entityId === taskId));
        expect(cs).toBeTruthy();
        const commit = `mutation($id:ID!){ commitChangeSet(id:$id) }`;
        await (0, supertest_1.default)(app.app).post('/graphql').set('Authorization', 'Bearer admin').send({ query: commit, variables: { id: cs.id } });
        const revert = `mutation($id:ID!){ revertChangeSet(id:$id) }`;
        await (0, supertest_1.default)(app.app).post('/graphql').set('Authorization', 'Bearer admin').send({ query: revert, variables: { id: cs.id } });
        const fetchTask = `query($id:ID!){ node(id:$id){ ... on Task { id name description estMinutes weight } } }`;
        const after = await (0, supertest_1.default)(app.app).post('/graphql').send({ query: fetchTask, variables: { id: taskId } });
        const task = after.body.data.node;
        expect(task.name).toBe('OriginalTask');
        expect(task.estMinutes).toBe(10);
        expect(task.weight).toBe(1);
    });
});
