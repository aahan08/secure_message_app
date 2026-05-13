const test = require('node:test');
const assert = require('node:assert/strict');

test('validateEnv rejects missing JWT_SECRET', () => {
  const { validateEnv } = require('../config/env');

  assert.throws(
    () => validateEnv({ MONGO_URI: 'mongodb://localhost:27017/obscure', PORT: '3000' }),
    /JWT_SECRET/
  );
});

test('validateEnv rejects missing MONGO_URI', () => {
  const { validateEnv } = require('../config/env');

  assert.throws(
    () => validateEnv({ JWT_SECRET: 'x'.repeat(32), PORT: '3000' }),
    /MONGO_URI/
  );
});

test('validateEnv rejects localhost python service in production', () => {
  const { validateEnv } = require('../config/env');

  assert.throws(
    () => validateEnv({
      MONGO_URI: 'mongodb://localhost:27017/obscure',
      JWT_SECRET: 'x'.repeat(32),
      NODE_ENV: 'production',
      PYTHON_SERVICE_URL: 'http://127.0.0.1:8000/api/v1/writer-prompt'
    }),
    /PYTHON_SERVICE_URL/
  );
});

test('validateEnv allows missing CORS_ORIGIN in production for mobile clients', () => {
  const { validateEnv } = require('../config/env');

  assert.doesNotThrow(() => validateEnv({
    MONGO_URI: 'mongodb://localhost:27017/obscure',
    JWT_SECRET: 'x'.repeat(32),
    NODE_ENV: 'production',
    REDIS_URL: 'rediss://default:secret@example.upstash.io:6379',
    MEDIA_ROUTES_ENABLED: 'false'
  }));
});

test('validateEnv rejects missing REDIS_URL in production', () => {
  const { validateEnv } = require('../config/env');

  assert.throws(
    () => validateEnv({
      MONGO_URI: 'mongodb://localhost:27017/obscure',
      JWT_SECRET: 'x'.repeat(32),
      NODE_ENV: 'production',
      MEDIA_ROUTES_ENABLED: 'false'
    }),
    /REDIS_URL/
  );
});

test('validateEnv allows missing REDIS_URL outside production', () => {
  const { validateEnv } = require('../config/env');

  assert.doesNotThrow(() => validateEnv({
    MONGO_URI: 'mongodb://localhost:27017/obscure',
    JWT_SECRET: 'x'.repeat(32),
    NODE_ENV: 'test',
    MEDIA_ROUTES_ENABLED: 'false'
  }));
});
