const HttpError = require('../utils/http-error');

function getAllowedOrigins() {
  const configured = process.env.CORS_ORIGINS;
  const values = configured
    ? configured.split(',').map((origin) => origin.trim()).filter(Boolean)
    : ['http://localhost:8765', 'http://127.0.0.1:8765'];
  return new Set(values);
}

function corsOptions() {
  const allowedOrigins = getAllowedOrigins();
  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new HttpError(403, 'FORBIDDEN', 'This origin is not allowed.'));
    },
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  };
}

module.exports = { corsOptions };
