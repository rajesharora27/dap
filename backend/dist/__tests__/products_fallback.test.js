"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("../../src/server");
const supertest_1 = __importDefault(require("supertest"));
describe('products fallback sample data', () => {
    let httpServer;
    beforeAll(async () => {
        process.env.AUTH_FALLBACK = '1';
        const created = await (0, server_1.createApp)();
        httpServer = created.httpServer;
    });
    afterAll(async () => {
        await new Promise(res => httpServer.close(res));
    });
    it('returns sample products when in fallback mode', async () => {
        const query = '{ products(first:5) { edges { node { id name } } totalCount } }';
        const res = await (0, supertest_1.default)(httpServer).post('/graphql').send({ query });
        expect(res.status).toBe(200);
        const edges = res.body.data.products.edges;
        expect(edges.length).toBeGreaterThan(0);
        expect(edges[0].node.id).toMatch(/^p-/);
    });
});
