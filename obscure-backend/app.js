const express = require('express');
const axios = require('axios');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const { getMongoStatus } = require('./config/database');
const { asyncHandler } = require('./middleware/asyncHandler');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { HttpError } = require('./utils/httpError');

function createApp({
  env = process.env,
  mongooseConnection = mongoose.connection,
  skipRoutes = false
} = {}) {
  const app = express();
  app.set('trust proxy', 1);

  app.use(express.json({ limit: '100kb' }));
  app.use(helmet());
  app.use(cors(createCorsOptions(env)));

  if (env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  app.get('/health', (req, res) => {
    const mongo = getMongoStatus(mongooseConnection);
    const ok = mongo === 'connected';
    res.status(ok ? 200 : 503).json({
      ok,
      uptime: process.uptime(),
      timestamp: Date.now(),
      mongo
    });
  });

  if (!skipRoutes) {
    const userRoutes = require('./routes/userRoutes');
    const roomRoutes = require('./routes/roomRoutes');
    const messageRoutes = require('./routes/messageRoutes');
    const mediaRoutesEnabled = env.MEDIA_ROUTES_ENABLED !== false && env.MEDIA_ROUTES_ENABLED !== 'false';
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 50,
      standardHeaders: true,
      legacyHeaders: false
    });

    app.use('/api/users', authLimiter);
    app.use('/api/users', userRoutes);
    app.use('/api/rooms', roomRoutes);
    app.use('/api/messages', messageRoutes);
    if (mediaRoutesEnabled) {
      const mediaRoutes = require('./routes/mediaRoutes');
      app.use('/api/media', mediaRoutes);
    }
    app.post('/api/proxy/writer-prompt', asyncHandler(createWriterPromptProxy(env)));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

function createCorsOptions(env) {
  const allowed = parseAllowedOrigins(env.CORS_ORIGIN);
  const isProduction = env.NODE_ENV === 'production';

  return {
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowed.includes(origin)) return cb(null, true);
      if (!isProduction && allowed.length === 0) return cb(null, true);
      return cb(new HttpError(403, 'Not allowed by CORS', 'CORS_NOT_ALLOWED'));
    },
    credentials: true
  };
}

function parseAllowedOrigins(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function createWriterPromptProxy(env) {
  return async function writerPromptProxy(req, res) {
    if (!env.PYTHON_SERVICE_URL) {
      throw new HttpError(503, 'AI service is not configured', 'AI_SERVICE_NOT_CONFIGURED');
    }

    try {
      const response = await axios.post(env.PYTHON_SERVICE_URL, req.body, { timeout: 15000 });
      res.json(response.data);
    } catch (error) {
      const status = error.response?.status || 502;
      throw new HttpError(status, 'Error communicating with the AI service', 'AI_SERVICE_ERROR');
    }
  };
}

module.exports = {
  createApp,
  createCorsOptions,
  parseAllowedOrigins
};
