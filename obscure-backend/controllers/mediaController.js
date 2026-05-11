const { nanoid } = require('nanoid');
const s3 = require('../config/spaces');
const { HttpError } = require('../utils/httpError');
const { getExtensionForContentType, isSafeUploadKey } = require('../utils/mediaSafety');

exports.getUploadUrl = async (req, res) => {
  const { contentType } = req.body || {};
  const extension = getExtensionForContentType(contentType);
  if (!extension) throw new HttpError(400, 'Unsupported contentType');

  const fileKey = `uploads/${nanoid(12)}.${extension}`;
  const params = {
    Bucket: process.env.DO_SPACES_BUCKET,
    Key: fileKey,
    ContentType: contentType
  };

  const uploadUrl = await s3.getSignedUrlPromise('putObject', {
    ...params,
    Expires: 60 * 5
  });
  const fileUrl = `https://${normalizeCdnHost(process.env.DO_SPACES_CDN)}/${fileKey}`;

  res.json({ uploadUrl, fileUrl, fileKey });
};

exports.getDownloadUrl = async (req, res) => {
  const { fileKey } = req.query || {};
  if (!isSafeUploadKey(fileKey)) throw new HttpError(400, 'Invalid fileKey');

  const downloadUrl = await s3.getSignedUrlPromise('getObject', {
    Bucket: process.env.DO_SPACES_BUCKET,
    Key: fileKey,
    Expires: 60 * 5
  });

  res.json({ downloadUrl });
};

function normalizeCdnHost(value) {
  return String(value || '').replace(/^https?:\/\//i, '').replace(/\/+$/g, '');
}
