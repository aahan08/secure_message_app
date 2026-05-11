const CONTENT_TYPE_EXTENSIONS = Object.freeze({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'video/mp4': 'mp4',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a'
});

function getExtensionForContentType(contentType) {
  if (!contentType || typeof contentType !== 'string') return null;
  return CONTENT_TYPE_EXTENSIONS[contentType.toLowerCase()] || null;
}

function isSafeUploadKey(fileKey) {
  if (!fileKey || typeof fileKey !== 'string') return false;
  return /^uploads\/[A-Za-z0-9_-]{8,64}\.(jpg|png|webp|pdf|mp4|mp3|m4a)$/.test(fileKey);
}

module.exports = {
  getExtensionForContentType,
  isSafeUploadKey
};
