const express = require('express');
const multer = require('multer');
const uploadService = require('./uploads.service');
const createUploadsController = require('./uploads.controller');
const { authenticate } = require('../../middleware/authenticate');

const receiveFile = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024,
    files: 1,
  },
});

function createUploadsRouter(service = uploadService) {
  const router = express.Router();
  const controller = createUploadsController(service);
  router.use(authenticate);
  router.post('/product-cover', receiveFile.single('file'), controller.create);
  return router;
}

module.exports = { createUploadsRouter };
