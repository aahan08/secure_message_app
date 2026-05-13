const DEFAULT_PORT = 3000;

function validateEnv(source = process.env) {
  const env = { ...source };
  const errors = [];
  const nodeEnv = env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const mediaEnabled = env.MEDIA_ROUTES_ENABLED !== 'false';

  requireValue(env, 'MONGO_URI', errors);
  requireValue(env, 'JWT_SECRET', errors);
  if (isProduction) {
    requireValue(env, 'REDIS_URL', errors);
  }

  const port = env.PORT || String(DEFAULT_PORT);
  if (!/^\d+$/.test(String(port))) {
    errors.push('PORT must be a number');
  }

  if (
    isProduction &&
    env.PYTHON_SERVICE_URL &&
    /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/i.test(env.PYTHON_SERVICE_URL)
  ) {
    errors.push('PYTHON_SERVICE_URL cannot point to localhost in production');
  }

  if (mediaEnabled) {
    for (const key of [
      'DO_SPACES_ENDPOINT',
      'DO_SPACES_KEY',
      'DO_SPACES_SECRET',
      'DO_SPACES_BUCKET',
      'DO_SPACES_CDN'
    ]) {
      requireValue(env, key, errors);
    }
  }

  if (errors.length) {
    throw new Error(`Invalid environment: ${errors.join('; ')}`);
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: Number(port),
    MONGO_URI: env.MONGO_URI,
    JWT_SECRET: env.JWT_SECRET,
    REDIS_URL: env.REDIS_URL || '',
    CORS_ORIGIN: env.CORS_ORIGIN || '',
    PYTHON_SERVICE_URL: env.PYTHON_SERVICE_URL || '',
    MEDIA_ROUTES_ENABLED: mediaEnabled,
    DO_SPACES_ENDPOINT: env.DO_SPACES_ENDPOINT,
    DO_SPACES_KEY: env.DO_SPACES_KEY,
    DO_SPACES_SECRET: env.DO_SPACES_SECRET,
    DO_SPACES_BUCKET: env.DO_SPACES_BUCKET,
    DO_SPACES_CDN: normalizeCdnHost(env.DO_SPACES_CDN),
    GOOGLE_APPLICATION_CREDENTIALS: env.GOOGLE_APPLICATION_CREDENTIALS,
    FIREBASE_SA_BASE64: env.FIREBASE_SA_BASE64,
    FIREBASE_SA_JSON: env.FIREBASE_SA_JSON
  };
}

function requireValue(env, key, errors) {
  if (!env[key] || !String(env[key]).trim()) {
    errors.push(`${key} is required`);
  }
}

function normalizeCdnHost(value) {
  if (!value) return value;
  return String(value).replace(/^https?:\/\//i, '').replace(/\/+$/g, '');
}

module.exports = { validateEnv };
