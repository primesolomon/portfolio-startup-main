const express = require('express');
const authService = require('./auth.service');
const createAuthController = require('./auth.controller');
const { loginSchema } = require('./auth.schema');
const { validateBody } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');

function createAuthRouter(service = authService) {
  const router = express.Router();
  const controller = createAuthController(service);

  router.post('/login', validateBody(loginSchema), controller.login);
  router.get('/me', authenticate, controller.me);
  return router;
}

module.exports = { createAuthRouter };
