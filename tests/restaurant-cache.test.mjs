import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
let server, restaurantsApi;
const originalFetch = globalThis.fetch;
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
before(async () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'test-key' } });
  server = await createServer({ configFile: false, root: process.cwd(), optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, ws: false } });
  ({ restaurantsApi } = await server.ssrLoadModule('/src/api/restaurants.ts'));
});
after(async () => {
  globalThis.fetch = originalFetch;
  if (originalStorage === undefined) delete globalThis.localStorage;
  else Object.defineProperty(globalThis, 'localStorage', originalStorage);
  await server?.close();
});
test('all dashboard restaurant reads bypass stored responses, including after a save', async () => {
  const calls = [];
  let restaurant = { id: 'insomnia', name: 'Old name', section: 'chauncey', location: {} };
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options });
    if (options.method === 'POST') restaurant = { ...restaurant, ...JSON.parse(options.body) };
    return Response.json(url.includes('/restaurants?') ? [restaurant] : restaurant);
  };
  assert.equal((await restaurantsApi.getAll())[0].name, 'Old name');
  await restaurantsApi.update('insomnia', { name: 'New name' });
  assert.equal((await restaurantsApi.getAll())[0].name, 'New name');
  await restaurantsApi.getById('insomnia');
  await restaurantsApi.getBySection('chauncey');
  for (const call of calls.filter(c => c.method !== 'POST')) {
    assert.equal(call.cache, 'no-store');
    assert.equal(new URL(call.url).searchParams.get('key'), 'test-key');
  }
});
