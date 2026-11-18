const jwt = require('jsonwebtoken');
const getJwtConfig = require('../config/jwt');

function sendUnauthenticated(res) {
  return res.status(401).json({
    error: {
      code: 'UNAUTHENTICATED',
      message: 'A valid bearer token is required.',
    },
  });
}

function authenticate(req, res, next) {
  const match = /^Bearer ([^\s]+)$/i.exec(
    req.get('authorization') || ''
  );

  if (!match) {
    return sendUnauthenticated(res);
  }

  let config;

  try {
    config = getJwtConfig();
  } catch (error) {
    return next(error);
  }

  let payload;

  try {
    payload = jwt.verify(match[1], config.secret);
  } catch {
    return sendUnauthenticated(res);
  }

  if (
    typeof payload === 'string' ||
    typeof payload.sub !== 'string' ||
    !/^\d+$/.test(payload.sub)
  ) {
    return sendUnauthenticated(res);
  }

  req.admin = { id: Number(payload.sub) };
  return next();
}

module.exports = { authenticate };