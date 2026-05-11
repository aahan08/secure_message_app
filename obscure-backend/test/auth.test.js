const test = require('node:test');
const assert = require('node:assert/strict');

test('extractBearerToken rejects missing bearer token', () => {
  const { extractBearerToken } = require('../utils/jwt');

  assert.equal(extractBearerToken(''), null);
  assert.equal(extractBearerToken('Basic abc'), null);
});

test('requireAuth rejects invalid JWT', async () => {
  const { createRequireAuth } = require('../middleware/auth');
  const requireAuth = createRequireAuth({
    UserModel: {
      findById() {
        throw new Error('User lookup should not run for invalid tokens');
      }
    }
  });
  const req = { headers: { authorization: 'Bearer invalid-token' } };
  const res = captureResponse();

  await requireAuth(req, res, () => {
    throw new Error('next should not be called');
  });

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
});

test('requireAuth accepts valid JWT and loads user from MongoDB', async () => {
  process.env.JWT_SECRET = 'test-secret-with-enough-length';
  const { signAccessToken } = require('../utils/jwt');
  const { createRequireAuth } = require('../middleware/auth');
  const token = signAccessToken({ sub: 'user123', uname: 'alice', tv: 2 });
  const requireAuth = createRequireAuth({
    UserModel: {
      findById(id) {
        assert.equal(id, 'user123');
        return {
          select() {
            return Promise.resolve({ _id: 'user123', username: 'alice', tokenVersion: 2 });
          }
        };
      }
    }
  });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = captureResponse();
  let nextCalled = false;

  await requireAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, { id: 'user123', username: 'alice' });
});

function captureResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}
