const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('chat socket does not keep a module-level user/socket registry', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'sockets', 'chatSocket.js'), 'utf8');

  assert.equal(source.includes('userSockets'), false);
  assert.equal(source.includes('new Map()'), false);
  assert.equal(source.includes('new Set()'), false);
});
