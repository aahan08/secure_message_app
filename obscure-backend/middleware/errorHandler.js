function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: {
      message: 'Not found',
      code: 'NOT_FOUND'
    }
  });
}

function errorHandler(err, req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production';
  const status = Number.isInteger(err.status) ? err.status : 500;
  const code = err.code || (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');
  const message = status === 500 && isProduction ? 'Server error' : err.message || 'Server error';

  if (status >= 500) {
    console.error('request error', {
      method: req.method,
      path: req.originalUrl,
      message: err.message,
      stack: isProduction ? undefined : err.stack
    });
  }

  res.status(status).json({
    error: {
      message,
      code
    }
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
