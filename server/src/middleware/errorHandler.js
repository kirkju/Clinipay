/**
 * Global Express error handler.
 * Logs the full error server-side but never leaks stack traces to the client
 * in production.
 */
function errorHandler(err, req, res, _next) {
  // Log full error for server diagnostics
  console.error('[Error]', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && isProduction
      ? 'An internal server error occurred.'
      : err.message || 'An internal server error occurred.',
    ...(isProduction ? {} : { stack: err.stack }),
  });
}

module.exports = { errorHandler };
