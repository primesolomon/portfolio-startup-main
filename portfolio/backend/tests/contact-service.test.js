const test = require('node:test');
const assert = require('node:assert/strict');
const { createContactService } = require('../src/modules/contact/contact.service');

const mailVariables = [
  'CONTACT_RECIPIENT_EMAIL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'SMTP_FROM',
];

function preserveEnvironment() {
  const previous = Object.fromEntries(
    mailVariables.map((name) => [name, process.env[name]])
  );
  return () => {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  };
}

function configureMail() {
  process.env.CONTACT_RECIPIENT_EMAIL = 'recipient@example.test';
  process.env.SMTP_HOST = 'smtp.example.test';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'user';
  process.env.SMTP_PASSWORD = 'password';
  process.env.SMTP_FROM = 'verified@example.test';
}

test('contact service distinguishes missing configuration and relay failures', async () => {
  const restore = preserveEnvironment();
  try {
    for (const name of mailVariables) delete process.env[name];
    await assert.rejects(
      createContactService().send({
        name: 'Visitor',
        email: 'visitor@example.test',
        message: 'A sufficiently long message.',
      }),
      (error) => error.status === 503 && error.code === 'DELIVERY_UNAVAILABLE'
    );

    configureMail();
    const service = createContactService(() => ({
      async sendMail() {
        throw new Error('private relay details must not be surfaced');
      },
    }));
    await assert.rejects(
      service.send({
        name: 'Visitor',
        email: 'visitor@example.test',
        message: 'A sufficiently long message.',
      }),
      (error) => error.status === 502
        && error.code === 'DELIVERY_FAILED'
        && !error.message.includes('private relay')
    );
  } finally {
    restore();
  }
});
