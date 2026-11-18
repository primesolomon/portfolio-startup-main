const express = require('express');
const siteContentService = require('./site-content.service');
const createSiteContentController = require('./site-content.controller');
const { siteContentPatchSchema } = require('./site-content.schema');
const { validateBody } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');

function createPublicSiteContentRouter(service = siteContentService) {
  const router = express.Router();
  const controller = createSiteContentController(service);
  router.get('/', controller.get);
  return router;
}

function createAdminSiteContentRouter(service = siteContentService) {
  const router = express.Router();
  const controller = createSiteContentController(service);
  router.use(authenticate);
  router.patch('/', validateBody(siteContentPatchSchema), controller.update);
  return router;
}

module.exports = {
  createPublicSiteContentRouter,
  createAdminSiteContentRouter,
};
