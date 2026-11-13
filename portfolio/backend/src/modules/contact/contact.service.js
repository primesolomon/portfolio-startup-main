const nodemailer = require('nodemailer');
const HttpError = require('../../utils/http-error');

function getMailConfig() {
  const required = [
    'CONTACT_RECIPIENT_EMAIL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'SMTP_FROM',
  ];
  if (required.some((name) => !process.env[name])) return null;

  const port = Number(process.env.SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;

  return {
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    from: process.env.SMTP_FROM,
    to: process.env.CONTACT_RECIPIENT_EMAIL,
  };
}

function createContactService(createTransport = nodemailer.createTransport) {
  async function send(message) {
    const config = getMailConfig();
    if (!config) {
      throw new HttpError(
        503,
        'DELIVERY_UNAVAILABLE',
        'Contact message delivery is not configured.'
      );
    }

    const transporter = createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });

    try {
      await transporter.sendMail({
        from: config.from,
        to: config.to,
        replyTo: message.email,
        subject: 'New message from the portfolio contact form',
        text: [
          `Name: ${message.name}`,
          `Email: ${message.email}`,
          '',
          message.message,
        ].join('\n'),
      });
    } catch (error) {
      console.error('Contact message delivery failed.', error.code || error.name);
      throw new HttpError(
        502,
        'DELIVERY_FAILED',
        'The contact message could not be delivered.'
      );
    }
  }

  return { send };
}

module.exports = {
  ...createContactService(),
  createContactService,
};
