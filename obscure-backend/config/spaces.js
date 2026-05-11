const AWS = require('aws-sdk');

function createSpacesClient(env = process.env) {
  return new AWS.S3({
    endpoint: new AWS.Endpoint(env.DO_SPACES_ENDPOINT),
    accessKeyId: env.DO_SPACES_KEY,
    secretAccessKey: env.DO_SPACES_SECRET,
    signatureVersion: 'v4',
    region: env.DO_SPACES_REGION || 'sgp1'
  });
}

module.exports = createSpacesClient();
module.exports.createSpacesClient = createSpacesClient;
