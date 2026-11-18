const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { corsOptions } = require('./config/cors');
const HttpError = require('./utils/http-error');
const authService = require('./modules/auth/auth.service');
const productService = require('./modules/products/products.service');
const siteContentService = require('./modules/site-content/site-content.service');
const contactService = require('./modules/contact/contact.service');
const uploadService = require('./modules/uploads/uploads.service');
const { createAuthRouter } = require('./modules/auth/auth.routes');
const {
  createPublicProductsRouter,
  createAdminProductsRouter,
} = require('./modules/products/products.route');
const {
  createPublicSiteContentRouter,
  createAdminSiteContentRouter,
} = require('./modules/site-content/site-content.route');
const { createContactRouter } = require('./modules/contact/contact.route');
const { createUploadsRouter } = require('./modules/uploads/uploads.route');
const pool = require('./config/database');

function createApp(services = {}) {
  const app = express();
  const trustedProxyHops = Number(process.env.TRUST_PROXY || 0);
  if (!Number.isInteger(trustedProxyHops) || trustedProxyHops < 0 || trustedProxyHops > 5) {
    throw new Error('TRUST_PROXY must be a whole number between 0 and 5.');
  }
  if (trustedProxyHops > 0) app.set('trust proxy', trustedProxyHops);

  const createLimiter = (limit, windowMs) => rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    handler(req, res) {
      res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
        },
      });
    },
  });
  const selected = {
    auth: services.auth || authService,
    products: services.products || productService,
    siteContent: services.siteContent || siteContentService,
    contact: services.contact || contactService,
    uploads: services.uploads || uploadService,
  };

  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors(corsOptions()));
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/auth/login', createLimiter(10, 15 * 60 * 1000));
  app.use('/api/contact-messages', createLimiter(5, 15 * 60 * 1000));
  app.use('/api/admin/uploads', createLimiter(20, 15 * 60 * 1000));
  app.use('/uploads/product-covers', express.static(uploadService.getUploadDir(), {
    fallthrough: true,
    dotfiles: 'deny',
    index: false,
    maxAge: '1d',
  }));

  app.get('/health', (req, res) => {
    res.status(200).json({ data: { status: 'ok' } });
  });
  app.get('/ready', async (req, res, next) => {
    try {
      await pool.query('SELECT 1');
      return res.status(200).json({ data: { status: 'ready' } });
    } catch (error) {
      console.error('Readiness check failed.', error.code || error.name);
      return res.status(503).json({
        error: {
          code: 'NOT_READY',
          message: 'The service is temporarily unavailable.',
        },
      });
    }
  });
  app.use('/api/auth', createAuthRouter(selected.auth));
  app.use('/api/site-content', createPublicSiteContentRouter(selected.siteContent));
  app.use('/api/products', createPublicProductsRouter(selected.products));
  app.use('/api/contact-messages', createContactRouter(selected.contact));
  app.use('/api/admin/site-content', createAdminSiteContentRouter(selected.siteContent));
  app.use('/api/admin/products', createAdminProductsRouter(selected.products));
  app.use('/api/admin/uploads', createUploadsRouter(selected.uploads));

  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found.',
      },
    });
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    let normalized = error;
    if (error.code === 'LIMIT_FILE_SIZE') {
      normalized = new HttpError(413, 'FILE_TOO_LARGE', 'Image must be 4 MiB or smaller.');
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE' || error.code === 'LIMIT_FILE_COUNT') {
      normalized = new HttpError(400, 'VALIDATION_ERROR', 'Upload exactly one file named file.');
    } else if (error.type === 'entity.too.large') {
      normalized = new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
    } else if (error.type === 'entity.parse.failed') {
      normalized = new HttpError(400, 'VALIDATION_ERROR', 'Request body must be valid JSON.');
    }

    if (!(normalized instanceof HttpError)) {
      console.error(error);
      normalized = new HttpError(500, 'INTERNAL_ERROR', 'An unexpected server error occurred.');
    }

    const body = {
      error: {
        code: normalized.code,
        message: normalized.message,
      },
    };
    if (normalized.details) body.error.details = normalized.details;
    return res.status(normalized.status).json(body);
  });

  return app;
}

const app = createApp();
module.exports = app;
module.exports.createApp = createApp;
