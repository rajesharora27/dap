import { createApp } from '../../src/server';
import request from 'supertest';

describe('products fallback sample data', () => {
  let httpServer: any;
  beforeAll(async () => {
    process.env.AUTH_FALLBACK = '1';
    const created = await createApp();
    httpServer = created.httpServer;
  });
  afterAll(async () => {
    await new Promise(res => httpServer.close(res));
  });
  it('returns sample products when in fallback mode', async () => {
    const query = '{ products(first:5) { edges { node { id name } } totalCount } }';
    const res = await request(httpServer).post('/graphql').send({ query });
    expect(res.status).toBe(200);
    const edges = res.body.data.products.edges;
    expect(edges.length).toBeGreaterThan(0);
    expect(edges[0].node.id).toMatch(/^p-/);
  });
});
