const express = require('express');
const { z } = require('zod');
const productService = require('./products.service');
const createProductsController = require('./products.controller');
const {
  createProductSchema,
  updateProductSchema,
  statusSchema,
  categories,
} = require('./products.schema');
const { validateBody } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const HttpError = require('../../utils/http-error');

function parseQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const { validationDetails } = require('../../utils/validation');
      return next(new HttpError(
        400,
        'VALIDATION_ERROR',
        'Request validation failed.',
        validationDetails(result.error.issues)
      ));
    }
    req.validatedQuery = result.data;
    return next();
  };
}

const publicQuerySchema = z.object({
  category: z.enum(categories).optional(),
  featured: z.enum(['true', 'false']).optional(),
}).strict();
const adminQuerySchema = z.object({
  status: z.enum(['draft', 'published', 'archived']).optional(),
}).strict();

function createPublicProductsRouter(service = productService) {
  const router = express.Router();
  const controller = createProductsController(service);
  router.get('/', parseQuery(publicQuerySchema), controller.listPublic);
  router.get('/:slug', controller.getPublic);
  return router;
}

function createAdminProductsRouter(service = productService) {
  const router = express.Router();
  const controller = createProductsController(service);
  router.use(authenticate);
  router.get('/', parseQuery(adminQuerySchema), controller.listAdmin);
  router.post('/', validateBody(createProductSchema), controller.create);
  router.get('/:id', controller.getAdmin);
  router.patch('/:id/status', validateBody(statusSchema), controller.updateStatus);
  router.patch('/:id', validateBody(updateProductSchema), controller.update);
  return router;
}

module.exports = { createPublicProductsRouter, createAdminProductsRouter };
