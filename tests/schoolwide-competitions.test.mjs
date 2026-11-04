import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
let server, competitionsApi;
const originalFetch = globalThis.fetch;
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
before(async () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'test-key' } });
  server = await createServer({ configFile: false, root: process.cwd(), optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, ws: false } });
  ({ schoolwideCompetitionsApi: competitionsApi } = await server.ssrLoadModule('/src/api/schoolwideCompetitions.ts'));
});
after(async () => {
  globalThis.fetch = originalFetch;
  if (originalStorage === undefined) delete globalThis.localStorage;
  else Object.defineProperty(globalThis, 'localStorage', originalStorage);
  await server?.close();
});
test('photo type and approved counts survive create, update, list, and detail calls', async () => {
  const calls = [];
  const competition = { id: 'photos', name: 'Campus Photos', scoringType: 'approvedPhotos', prize: 'Dinner', joinDate: 1, startDate: 2, endDate: 3 };
  const participant = { id: 'student', username: 'student', approvedPhotos: 4, daysLogged: 0, score: 4 };
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options });
    return Response.json({ status: true, competition, competitions: [competition], participants: [participant] });
  };
  assert.equal((await competitionsApi.create(competition)).scoringType, 'approvedPhotos');
  assert.equal((await competitionsApi.update('photos', competition)).scoringType, 'approvedPhotos');
  assert.equal((await competitionsApi.getAll())[0].scoringType, 'approvedPhotos');
  assert.equal((await competitionsApi.get('photos')).participants[0].approvedPhotos, 4);
  for (const call of calls.filter(call => call.method === 'POST')) {
    assert.equal(JSON.parse(call.body).scoringType, 'approvedPhotos');
    assert.equal(new URL(call.url).searchParams.get('key'), 'test-key');
  }
});
