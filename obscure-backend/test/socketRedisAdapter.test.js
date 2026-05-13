const test = require('node:test');
const assert = require('node:assert/strict');

test('configureSocketRedisAdapter installs adapter when REDIS_URL is configured', async () => {
  const { configureSocketRedisAdapter } = require('../sockets/redisAdapter');

  class FakeRedis {
    static instances = [];

    constructor(url, options) {
      this.url = url;
      this.options = options;
      this.connected = false;
      this.disconnected = false;
      FakeRedis.instances.push(this);
    }

    duplicate() {
      return new FakeRedis(this.url, this.options);
    }

    async connect() {
      this.connected = true;
    }

    disconnect() {
      this.disconnected = true;
    }
  }

  const installedAdapters = [];
  const io = {
    adapter(value) {
      installedAdapters.push(value);
    }
  };

  const adapterResult = { name: 'redis-adapter' };
  const result = await configureSocketRedisAdapter(io, {
    REDIS_URL: 'rediss://default:secret@example.upstash.io:6379'
  }, {
    Redis: FakeRedis,
    createAdapter: (pubClient, subClient) => {
      assert.equal(pubClient.connected, true);
      assert.equal(subClient.connected, true);
      return adapterResult;
    }
  });

  assert.equal(installedAdapters.length, 1);
  assert.equal(installedAdapters[0], adapterResult);
  assert.equal(FakeRedis.instances.length, 2);
  assert.equal(FakeRedis.instances[0].url, 'rediss://default:secret@example.upstash.io:6379');
  assert.equal(FakeRedis.instances[0].options.lazyConnect, true);
  assert.equal(result.pubClient, FakeRedis.instances[0]);
  assert.equal(result.subClient, FakeRedis.instances[1]);
});

test('configureSocketRedisAdapter does nothing without REDIS_URL', async () => {
  const { configureSocketRedisAdapter } = require('../sockets/redisAdapter');

  let adapterCalls = 0;
  const result = await configureSocketRedisAdapter({
    adapter() {
      adapterCalls += 1;
    }
  }, {});

  assert.equal(result, null);
  assert.equal(adapterCalls, 0);
});
