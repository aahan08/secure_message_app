const test = require('node:test');
const assert = require('node:assert/strict');

test('media safety rejects missing or unsafe upload content types', () => {
  const { getExtensionForContentType } = require('../utils/mediaSafety');

  assert.equal(getExtensionForContentType(), null);
  assert.equal(getExtensionForContentType('text/html'), null);
  assert.equal(getExtensionForContentType('image/svg+xml'), null);
});

test('media safety maps allowed content types to fixed extensions', () => {
  const { getExtensionForContentType } = require('../utils/mediaSafety');

  assert.equal(getExtensionForContentType('image/jpeg'), 'jpg');
  assert.equal(getExtensionForContentType('image/png'), 'png');
  assert.equal(getExtensionForContentType('application/pdf'), 'pdf');
});

test('media safety allows only expected upload file keys', () => {
  const { isSafeUploadKey } = require('../utils/mediaSafety');

  assert.equal(isSafeUploadKey('uploads/abcDEF123456.jpg'), true);
  assert.equal(isSafeUploadKey('../serviceAccountKey.json'), false);
  assert.equal(isSafeUploadKey('uploads/abc/def.jpg'), false);
  assert.equal(isSafeUploadKey('avatars/abcDEF123456.jpg'), false);
});
