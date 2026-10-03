import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

let server;
let buildPatch;
let toDraft;
let schoolFoodsApi;
const originalFetch = globalThis.fetch;
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

before(async () => {
  server = await createServer({ configFile: false, root: process.cwd(), optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, ws: false } });
  ({ buildPatch, toDraft } = await server.ssrLoadModule('/src/utils/schoolFoodOverrides.ts'));
  ({ schoolFoodsApi } = await server.ssrLoadModule('/src/api/schoolFoods.ts'));
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'admin&key' } });
});
after(async () => {
  globalThis.fetch = originalFetch;
  if (originalStorage === undefined) delete Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  else Object.defineProperty(globalThis, 'localStorage', originalStorage);
  await server?.close();
});

const food = { id: 'food-1', school: 'purdue', name: 'Rice', calories: 100, protein: 2, fat: 3, labels: '["Vegan"]', is_favoritable: 1 };

test('unchanged and missing fields are omitted; fat writes as totalFat', () => {
  const original = toDraft(food);
  assert.deepEqual(buildPatch(original, original), {});
  assert.deepEqual(buildPatch({ ...original, calories: '123', totalFat: '-1' }, original), { calories: 123, totalFat: -1 });
  assert.deepEqual(buildPatch({ ...original, calories: '100.0' }, original), {});
});

test('validates numeric changes, blank names and label arrays', () => {
  const original = toDraft(food);
  for (const calories of ['', '-2', '-0.5', 'NaN', 'Infinity']) {
    assert.throws(() => buildPatch({ ...original, calories }, original), /nonnegative/);
  }
  assert.throws(() => buildPatch({ ...original, name: '  ' }, original), /blank/);
  for (const labels of ['null', '[1]', '{}', 'Vegan']) {
    assert.throws(() => buildPatch({ ...original, labels }, original), /JSON array/);
  }
  assert.deepEqual(buildPatch({ ...original, labels: '[ "Vegan" ]' }, original), {});
  assert.deepEqual(buildPatch({ ...original, labels: '[]', ingredients: '', isFavoritable: 'false' }, { ...original, ingredients: 'Rice' }), {
    ingredients: '', labels: '[]', isFavoritable: false,
  });
});

test('runs schema migration before posting a flat patch with encoded parameters', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return Response.json(calls.length === 1 ? { ok: true } : { status: true });
  };
  await schoolFoodsApi.override('food&1', { calories: 123, totalFat: 4 });
  assert.equal(calls.length, 2);
  assert.equal(new URL(calls[0].url).pathname, '/purdue/ensureSchema');
  assert.equal(new URL(calls[0].url).searchParams.get('key'), 'admin&key');
  assert.equal(new URL(calls[1].url).pathname, '/purdue/foods/overrideFood');
  assert.equal(new URL(calls[1].url).searchParams.get('foodID'), 'food&1');
  assert.equal(calls[1].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[1].options.body), { calories: 123, totalFat: 4 });
});

test('empty patches and failed migrations never submit overrides', async () => {
  let requests = 0;
  globalThis.fetch = async () => { requests++; return Response.json({ ok: false }); };
  await assert.rejects(schoolFoodsApi.override(food.id, {}), /Change at least/);
  assert.equal(requests, 0);
  await assert.rejects(schoolFoodsApi.override(food.id, { protein: 17 }), /schema/);
  assert.equal(requests, 1);
});

test('lookup bypasses cache and rejects foods outside the requested school', async () => {
  globalThis.fetch = async (url) => {
    assert.equal(new URL(url).searchParams.get('bypassCache'), 'true');
    assert.equal(new URL(url).searchParams.get('foodIds'), food.id);
    return Response.json([food]);
  };
  assert.deepEqual(await schoolFoodsApi.getById(food.id), food);
  globalThis.fetch = async () => Response.json([{ ...food, school: 'other' }]);
  await assert.rejects(schoolFoodsApi.getById(food.id), /not found/);
});

test('authorization and save errors propagate to the caller', async () => {
  globalThis.fetch = async () => new Response('Unauthorized', { status: 401 });
  await assert.rejects(schoolFoodsApi.override(food.id, { protein: 17 }), (error) => {
    assert.match(error.message, /401/);
    assert.ok(!error.message.includes('admin%26key'));
    return true;
  });
  let requests = 0;
  globalThis.fetch = async () => Response.json(++requests === 1 ? { ok: true } : { status: false });
  await assert.rejects(schoolFoodsApi.override(food.id, { protein: 17 }), /not saved/);
});
