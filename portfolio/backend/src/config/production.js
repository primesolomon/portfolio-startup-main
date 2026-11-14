function validPort(value) {
  const port = Number(value);
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

function isHttpsOrigin(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.origin === value;
  } catch {
    return false;
  }
}

function looksLikePlaceholder(value) {
  return /replace[-_ ]with|change[-_ ]me|placeholder|example/i.test(value);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateProductionConfig(env = process.env) {
  if (env.NODE_ENV !== 'production') return;

  const smtpVariables = [
    'CONTACT_RECIPIENT_EMAIL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'SMTP_FROM',
  ];
  const missing = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'CORS_ORIGINS',
  ].filter((name) => !env[name]?.trim());

  const invalid = [];
  if (smtpVariables.some((name) => env[name]?.trim())) {
    missing.push(...smtpVariables.filter((name) => !env[name]?.trim()));
  }
  if (env.JWT_SECRET && (
    env.JWT_SECRET.trim().length < 32 || looksLikePlaceholder(env.JWT_SECRET)
  )) {
    invalid.push('JWT_SECRET (must be a unique secret of at least 32 characters)');
  }
  if (env.DB_PASSWORD && looksLikePlaceholder(env.DB_PASSWORD)) {
    invalid.push('DB_PASSWORD (must not be a placeholder value)');
  }
  if (env.DB_SSL !== 'true') {
    invalid.push('DB_SSL (must be true in production)');
  }
  if (env.SMTP_PORT && !validPort(env.SMTP_PORT)) {
    invalid.push('SMTP_PORT (must be a valid port)');
  }
  for (const name of ['CONTACT_RECIPIENT_EMAIL', 'SMTP_FROM']) {
    if (env[name] && !isEmail(env[name])) {
      invalid.push(`${name} (must be a valid email address)`);
    }
  }
  if (env.CORS_ORIGINS) {
    const origins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);
    if (!origins.length || origins.some((origin) => !isHttpsOrigin(origin))) {
      invalid.push('CORS_ORIGINS (use comma-separated HTTPS origins only)');
    }
  }
  if (env.TRUST_PROXY !== undefined) {
    const proxyHops = Number(env.TRUST_PROXY);
    if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 5) {
      invalid.push('TRUST_PROXY (must be a whole number between 0 and 5)');
    }
  }

  if (missing.length || invalid.length) {
    const details = [...missing, ...invalid].join(', ');
    throw new Error(`Production configuration is incomplete or invalid: ${details}.`);
  }
}

module.exports = { validateProductionConfig };
