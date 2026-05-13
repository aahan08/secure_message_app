const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');

async function configureSocketRedisAdapter(io, env = {}, deps = {}) {
  const redisUrl = String(env.REDIS_URL || '').trim();
  if (!redisUrl) return null;

  const RedisClient = deps.Redis || Redis;
  const createAdapterFn = deps.createAdapter || createAdapter;
  const options = {
    lazyConnect: true,
    maxRetriesPerRequest: null
  };

  const pubClient = new RedisClient(redisUrl, options);
  const subClient = pubClient.duplicate();

  try {
    await Promise.all([
      connectRedisClient(pubClient),
      connectRedisClient(subClient)
    ]);

    io.adapter(createAdapterFn(pubClient, subClient));
    return { pubClient, subClient };
  } catch (error) {
    disconnectRedisClient(pubClient);
    disconnectRedisClient(subClient);
    throw error;
  }
}

async function connectRedisClient(client) {
  if (typeof client.connect === 'function') {
    await client.connect();
  }
}

function disconnectRedisClient(client) {
  if (typeof client.disconnect === 'function') {
    client.disconnect();
  }
}

function closeSocketRedisAdapter(adapterClients) {
  if (!adapterClients) return;
  disconnectRedisClient(adapterClients.pubClient);
  disconnectRedisClient(adapterClients.subClient);
}

module.exports = {
  configureSocketRedisAdapter,
  closeSocketRedisAdapter
};
