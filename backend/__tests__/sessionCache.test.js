import { jest } from '@jest/globals';
import { createSessionCache } from '../services/sessionCache.js';

function fakeRedis() {
  const values = new Map();
  const redis = {
    isReady: true,
    withCommandOptions: () => redis,
    get: jest.fn(async (key) => values.get(key) ?? null),
    set: jest.fn(async (key, value, { condition } = {}) => {
      if (condition === 'NX' && values.has(key)) return null;
      values.set(key, value);
      return 'OK';
    }),
    del: jest.fn(async (key) => Number(values.delete(key))),
  };
  return redis;
}

test('reuses a user’s cached stats and invalidates only that user’s workout data', async () => {
  const redis = fakeRedis();
  const cache = createSessionCache(() => redis);
  const load = jest.fn(async () => ({ totalSessions: 1 }));
  const other = jest.fn(async () => ({ totalSessions: 3 }));
  await cache.read('first', 'stats', load);
  await cache.read('second', 'stats', other);
  expect(await cache.read('first', 'stats', load)).toEqual({ totalSessions: 1 });
  expect(load).toHaveBeenCalledTimes(1);
  await cache.invalidate('first');
  load.mockResolvedValue({ totalSessions: 2 });
  expect(await cache.read('first', 'stats', load)).toEqual({ totalSessions: 2 });
  expect(await cache.read('second', 'stats', other)).toEqual({ totalSessions: 3 });
  expect(other).toHaveBeenCalledTimes(1);
});

test('a read that overlaps a write cannot repopulate the active cache', async () => {
  const redis = fakeRedis();
  const cache = createSessionCache(() => redis);
  let finishRead;
  let startRead;
  const started = new Promise((resolve) => { startRead = resolve; });
  const oldRead = cache.read('first', 'prs', () => {
    startRead();
    return new Promise((resolve) => { finishRead = resolve; });
  });
  await started;
  await cache.invalidate('first');
  const load = jest.fn(async () => ({ prs: ['new'] }));
  await cache.read('first', 'prs', load);
  finishRead({ prs: ['old'] });
  await oldRead;
  expect(await cache.read('first', 'prs', load)).toEqual({ prs: ['new'] });
  expect(load).toHaveBeenCalledTimes(1);
});

test('falls back to MongoDB when Redis is disabled or rejects a command', async () => {
  const redis = fakeRedis();
  const cache = createSessionCache(() => redis);
  redis.get.mockRejectedValueOnce(new Error('Redis offline'));
  const load = jest.fn(async () => ({ totalSessions: 2 }));
  expect(await cache.read('first', 'stats', load)).toEqual({ totalSessions: 2 });
  redis.isReady = false;
  await expect(cache.invalidate('first')).resolves.toBeUndefined();
  expect(await cache.read('first', 'stats', load)).toEqual({ totalSessions: 2 });
  expect(load).toHaveBeenCalledTimes(2);
});

test('falls back when a connected Redis server never answers a command', async () => {
  const redis = fakeRedis();
  const cache = createSessionCache(() => redis);
  redis.get.mockReturnValueOnce(new Promise(() => {}));
  expect(await cache.read('first', 'stats', async () => ({ totalSessions: 4 })))
    .toEqual({ totalSessions: 4 });
}, 1000);
