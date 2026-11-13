const express = require('express');
const contactService = require('./contact.service');
const createContactController = require('./contact.controller');
const { contactMessageSchema } = require('./contact.schema');
const { validateBody } = require('../../middleware/validate');

function createContactRouter(service = contactService) {
  const router = express.Router();
  const controller = createContactController(service);
  router.post('/', validateBody(contactMessageSchema), controller.create);
  return router;
}

module.exports = { createContactRouter };
