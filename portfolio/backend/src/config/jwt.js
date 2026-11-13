function getJwtConfig() {
  const secret = process.env.JWT_SECRET;
  const expiresInSeconds = Number(
    process.env.JWT_EXPIRES_IN_SECONDS || 3600
  );

  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }

  if (!Number.isInteger(expiresInSeconds) || expiresInSeconds < 60) {
    throw new Error('JWT_EXPIRES_IN_SECONDS must be at least 60.');
  }

  return { secret, expiresInSeconds };
}

module.exports = getJwtConfig;