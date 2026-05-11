const test = require('node:test');
const assert = require('node:assert/strict');

async function request(app, path) {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}${path}`);
    return {
      status: res.status,
      body: await res.json()
    };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('GET /health returns 200 when MongoDB is connected', async () => {
  const { createApp } = require('../app');
  const app = createApp({
    env: { CORS_ORIGIN: '', NODE_ENV: 'test' },
    mongooseConnection: { readyState: 1 },
    skipRoutes: true
  });

  const res = await request(app, '/health');

  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.mongo, 'connected');
  assert.equal(typeof res.body.uptime, 'number');
  assert.equal(typeof res.body.timestamp, 'number');
});

test('GET /health returns 503 when MongoDB is disconnected', async () => {
  const { createApp } = require('../app');
  const app = createApp({
    env: { CORS_ORIGIN: '', NODE_ENV: 'test' },
    mongooseConnection: { readyState: 0 },
    skipRoutes: true
  });

  const res = await request(app, '/health');

  assert.equal(res.status, 503);
  assert.equal(res.body.ok, false);
  assert.equal(res.body.mongo, 'disconnected');
});

test('createApp can disable media routes without Spaces environment', async () => {
  const { createApp } = require('../app');
  const app = createApp({
    env: { CORS_ORIGIN: '', NODE_ENV: 'test', MEDIA_ROUTES_ENABLED: 'false' },
    mongooseConnection: { readyState: 1 }
  });

  const res = await request(app, '/api/media/download-url?fileKey=uploads/abcDEF123456.jpg');

  assert.equal(res.status, 404);
});
