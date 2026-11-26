import { randomUUID } from 'node:crypto';
import { createClient } from 'redis';

const CACHE_SECONDS = 60;
const VERSION_SECONDS = CACHE_SECONDS * 2;
const COMMAND_TIMEOUT_MS = 200;
const RETRY_DELAY_MS = 1000;
let client;

export function startSessionCache(url) {
  if (!url || client) return;
  try {
    client = createClient({
      url,
      disableOfflineQueue: true,
      commandsQueueMaxLength: 100,
      socket: { connectTimeout: 1000 },
    });
    let reportedError = false;
    client.on('error', () => {
      if (!reportedError) console.warn('Redis unavailable. Using MongoDB for workout reads.');
      reportedError = true;
    });
    client.on('ready', () => { reportedError = false; });
    void client.connect().catch(() => { client = undefined; });
  } catch {
    console.warn('Redis configuration is invalid. Using MongoDB for workout reads.');
  }
}

export function createSessionCache(getClient) {
  const namespace = (userId) => `gymkhanna:workouts:v1:${userId}`;

  let retryAt = 0;

  async function command(run, { bypassCooldown = false } = {}) {
    const redis = getClient();
    if (!redis?.isReady || (!bypassCooldown && Date.now() < retryAt)) return undefined;

    const abort = new AbortController();
    let timer;
    const deadline = new Promise((resolve) => {
      timer = setTimeout(() => {
        retryAt = Date.now() + RETRY_DELAY_MS;
        abort.abort();
        resolve(undefined);
      }, COMMAND_TIMEOUT_MS);
    });

    try {
      // The abort signal can cancel queued work, but Redis may stall after receiving it.
      const response = run(redis.withCommandOptions({ abortSignal: abort.signal }));
      return await Promise.race([response, deadline]);
    } catch {
      return undefined;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    async read(userId, resource, load) {
      const prefix = namespace(userId);
      const versionKey = `${prefix}:version`;
      let version = await command((redis) => redis.get(versionKey));
      if (version === null) {
        const newVersion = randomUUID();
        const created = await command((redis) =>
          redis.set(versionKey, newVersion, {
            condition: 'NX',
            expiration: { type: 'EX', value: VERSION_SECONDS },
          }),
        );
        if (created === undefined) return load();
        version = created ? newVersion : await command((redis) => redis.get(versionKey));
      }
      if (!version) return load();

      // A write deletes the version key. A read in flight can only fill its old version.
      const key = `${prefix}:${version}:${resource}`;
      const cached = await command((redis) => redis.get(key));
      if (cached === undefined) return load();
      if (cached !== null) {
        try {
          return JSON.parse(cached);
        } catch {
          // Rebuild an unreadable entry from MongoDB.
        }
      }

      const data = await load();
      await command((redis) =>
        redis.set(key, JSON.stringify(data), { expiration: { type: 'EX', value: CACHE_SECONDS } }),
      );
      return data;
    },

    async invalidate(userId) {
      await command((redis) => redis.del(`${namespace(userId)}:version`), { bypassCooldown: true });
    },
  };
}

export const sessionCache = createSessionCache(() => client);
