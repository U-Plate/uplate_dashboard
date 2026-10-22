import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
let server;
let menuItemsApi;
const originalFetch = globalThis.fetch;
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
before(async () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'test-key' } });

  server = await createServer({ configFile: false, root: process.cwd(), optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, ws: false } });
  ({ menuItemsApi } = await server.ssrLoadModule('/src/api/menuItems.ts'));
});
after(async () => {
  globalThis.fetch = originalFetch;
  if (originalStorage === undefined) delete globalThis.localStorage;
  else Object.defineProperty(globalThis, 'localStorage', originalStorage);
  await server?.close();
});
const item = { id: 'latte', restaurantId: 'cafe', name: 'Latte', foods: [], possibleFoods: [], sizes: [] };
test('legacy items use All Items and named sections deserialize', () => {
  assert.equal(menuItemsApi.deserializeMenuItem(item).station, 'All Items');
  assert.equal(menuItemsApi.deserializeMenuItem({ ...item, station: ' Drinks ' }).station, 'Drinks');
});
test('section-only edits use the supported endpoint without clearing foods or sizes', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options });
    return Response.json(options.method === 'PUT' ? { status: true } : { ...item, station: 'Drinks' });
  };
  const updated = await menuItemsApi.update('cafe', 'latte', { station: 'Drinks' });
  assert.equal(calls[0].method, 'PUT');
  assert.match(calls[0].url, /\/admin\/cafe\/menu\/latte\?key=/);
  assert.deepEqual(JSON.parse(calls[0].body), { station: 'Drinks' });
  assert.equal(updated.station, 'Drinks');
});
test('creation uses server IDs and carries sections to the backend', async () => {
  let call;
  globalThis.fetch = async (url, options) => {
    call = { url, ...options };
    return Response.json({ status: true, id: 'server-id' });
  };
  const created = await menuItemsApi.create('cafe', { name: 'Latte', foods: [], possibleFoods: [], sizes: [], station: 'Drinks' });
  assert.equal(created.id, 'server-id');
  assert.match(call.url, /\/admin\/cafe\/menu\?key=/);
  assert.equal(JSON.parse(call.body).station, 'Drinks');
});


test('retail photos deserialize independently of ingredients and sizes', () => {
  const url = 'https://cdn.example/purdue/retail/cafe/latte.jpg?v=1';
  assert.equal(menuItemsApi.deserializeMenuItem({ ...item, imageUrl: url }).imageUrl, url);
  assert.equal(menuItemsApi.deserializeMenuItem(item).imageUrl, null);
});

test('admin photo publishing sends raw bytes and removal updates the item', async () => {
  const calls = [];
  const file = new File([new Uint8Array([255, 216, 255])], 'photo.jpg', { type: 'image/jpeg' });
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options });
    return Response.json({ ...item, imageUrl: options.method === 'DELETE' ? null : 'https://cdn.example/latte.jpg?v=2' });
  };
  const uploaded = await menuItemsApi.uploadPhoto('cafe', 'latte', file);
  assert.equal(uploaded.imageUrl, 'https://cdn.example/latte.jpg?v=2');
  assert.equal(calls[0].body, file);
  assert.equal(calls[0].headers['Content-Type'], 'image/jpeg');
  assert.match(calls[0].url, /\/admin\/cafe\/menu\/latte\/photo\?key=/);
  assert.equal((await menuItemsApi.removePhoto('cafe', 'latte')).imageUrl, null);
  assert.equal(calls[1].method, 'DELETE');
});
