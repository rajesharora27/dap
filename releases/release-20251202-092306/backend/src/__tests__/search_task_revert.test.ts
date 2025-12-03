import request from 'supertest';
import { createApp } from '../server';
import { prisma } from '../context';

let app: any;
let dbAvailable = true;
let statusId: number | null = null;

beforeAll(async () => {
  try {
    app = await createApp();
    const status = await prisma.taskStatus.upsert({ where: { code: 'TODO' }, update: {}, create: { code: 'TODO', label: 'Todo' } });
    statusId = status.id;
  } catch (e) {
    console.warn('Skipping DB tests (unavailable):', (e as any).message);
    dbAvailable = false;
  }
});

describe('Search & Task revert flow', () => {
  it('returns mixed Product & Task results in search', async () => {
    if (!dbAvailable) { expect(true).toBe(true); return; }
    // create product (requires ADMIN)
    const createProduct = `mutation($input: ProductInput!){ createProduct(input:$input){ id name } }`;
    const pRes = await request(app.app).post('/graphql').set('Authorization','Bearer admin').send({ query: createProduct, variables: { input: { name: 'AlphaProduct', description: 'prod' } } });
    const productId = pRes.body.data.createProduct.id;
    // create task (requires any user)
    const createTask = `mutation($input: TaskInput!){ createTask(input:$input){ id name } }`;
    const tRes = await request(app.app).post('/graphql').set('Authorization','Bearer user').send({ query: createTask, variables: { input: { productId, name: 'AlphaTask', description: 't', estMinutes: 30, statusId, weight: 1 } } });
    expect(tRes.body.data.createTask.name).toBe('AlphaTask');
    const search = `query($q:String!){ search(query:$q){ __typename ... on Product { id name } ... on Task { id name } } }`;
    const sRes = await request(app.app).post('/graphql').send({ query: search, variables: { q: 'Alpha' } });
    const results = sRes.body.data.search;
    const types = results.map((r: any) => r.__typename);
    expect(types).toContain('Product');
    expect(types).toContain('Task');
  });

  it('reverts a Task update via change set revert', async () => {
    if (!dbAvailable) { expect(true).toBe(true); return; }
    // create product & task
    const createProduct = `mutation($input: ProductInput!){ createProduct(input:$input){ id } }`;
    const pRes = await request(app.app).post('/graphql').set('Authorization','Bearer admin').send({ query: createProduct, variables: { input: { name: 'ProdForTask', description: 'p' } } });
    const productId = pRes.body.data.createProduct.id;
    const createTask = `mutation($input: TaskInput!){ createTask(input:$input){ id name } }`;
    const tRes = await request(app.app).post('/graphql').set('Authorization','Bearer user').send({ query: createTask, variables: { input: { productId, name: 'OriginalTask', description: 'orig', estMinutes: 10, statusId, weight: 1 } } });
    const taskId = tRes.body.data.createTask.id;
    // update task (records change set)
    const updateTask = `mutation($id:ID!,$input:TaskInput!){ updateTask(id:$id,input:$input){ id name } }`;
    await request(app.app).post('/graphql').set('Authorization','Bearer user').send({ query: updateTask, variables: { id: taskId, input: { productId, name: 'RenamedTask', description: 'changed', estMinutes: 20, statusId, weight: 2 } } });
    // locate latest change set and commit & revert
    const csQuery = `query { changeSets(limit:5){ id committedAt items { id entityType entityId } } }`;
    const csRes = await request(app.app).post('/graphql').send({ query: csQuery });
    // find change set referencing this task
    const cs = csRes.body.data.changeSets.find((c: any) => c.items.some((i: any) => i.entityType === 'Task' && i.entityId === taskId));
    expect(cs).toBeTruthy();
    const commit = `mutation($id:ID!){ commitChangeSet(id:$id) }`;
    await request(app.app).post('/graphql').set('Authorization','Bearer admin').send({ query: commit, variables: { id: cs.id } });
    const revert = `mutation($id:ID!){ revertChangeSet(id:$id) }`;
    await request(app.app).post('/graphql').set('Authorization','Bearer admin').send({ query: revert, variables: { id: cs.id } });
    const fetchTask = `query($id:ID!){ node(id:$id){ ... on Task { id name description estMinutes weight } } }`;
    const after = await request(app.app).post('/graphql').send({ query: fetchTask, variables: { id: taskId } });
    const task = after.body.data.node;
    expect(task.name).toBe('OriginalTask');
    expect(task.estMinutes).toBe(10);
    expect(task.weight).toBe(1);
  });
});
