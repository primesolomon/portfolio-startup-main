const test = require('node:test');
const assert = require('node:assert/strict');
const { validateProductionConfig } = require('../src/config/production');

const validConfig = {
  NODE_ENV: 'production',
  DB_HOST: 'db.example.com',
  DB_USER: 'portfolio',
  DB_PASSWORD: 'database-password',
  DB_NAME: 'portfolio',
  DB_SSL: 'true',
  JWT_SECRET: 'a-production-secret-with-at-least-thirty-two-characters',
  CLOUDINARY_CLOUD_NAME: 'portfolio',
  CLOUDINARY_API_KEY: 'api-key',
  CLOUDINARY_API_SECRET: 'api-secret',
  CONTACT_RECIPIENT_EMAIL: 'hello@example.com',
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: '587',
  SMTP_USER: 'smtp-user',
  SMTP_PASSWORD: 'smtp-password',
  SMTP_FROM: 'portfolio@example.com',
  CORS_ORIGINS: 'https://portfolio.example.com',
};

test('production configuration accepts complete secrets and HTTPS origins', () => {
  assert.doesNotThrow(() => validateProductionConfig(validConfig));
});

test('production configuration allows SMTP to remain unconfigured', () => {
  const configWithoutSmtp = { ...validConfig };
  for (const name of [
    'CONTACT_RECIPIENT_EMAIL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'SMTP_FROM',
  ]) {
    delete configWithoutSmtp[name];
  }

  assert.doesNotThrow(() => validateProductionConfig(configWithoutSmtp));
});

test('production configuration rejects missing secrets and non-HTTPS origins', () => {
  assert.throws(
    () => validateProductionConfig({
      ...validConfig,
      SMTP_PASSWORD: '',
      CORS_ORIGINS: 'http://localhost:8765',
    }),
    /SMTP_PASSWORD.*CORS_ORIGINS/
  );
});

test('production configuration rejects unsafe proxy and weak token settings', () => {
  assert.throws(
    () => validateProductionConfig({
      ...validConfig,
      JWT_SECRET: 'replace-with-a-random-secret-at-least-32-characters',
      DB_PASSWORD: 'replace-with-a-local-database-password',
      TRUST_PROXY: '6',
    }),
    /JWT_SECRET.*DB_PASSWORD.*TRUST_PROXY/
  );
});

test('production configuration requires TLS for the database connection', () => {
  assert.throws(
    () => validateProductionConfig({ ...validConfig, DB_SSL: 'false' }),
    /DB_SSL/
  );
});

test('production configuration validates mail addresses', () => {
  assert.throws(
    () => validateProductionConfig({
      ...validConfig,
      SMTP_FROM: 'not-an-email',
    }),
    /SMTP_FROM/
  );
});

test('production configuration does not restrict local development', () => {
  assert.doesNotThrow(() => validateProductionConfig({
    NODE_ENV: 'development',
    CORS_ORIGINS: 'http://localhost:8765',
  }));
});
