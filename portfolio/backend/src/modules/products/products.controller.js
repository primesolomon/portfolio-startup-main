const HttpError = require('../../utils/http-error');

function parseId(value) {
  if (!/^[1-9]\d*$/.test(value || '')) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'A positive product ID is required.');
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'A positive product ID is required.');
  }
  return id;
}

function createProductsController(service) {
  return {
    async listPublic(req, res) {
      const query = req.validatedQuery || {};
      res.status(200).json({
        data: await service.listPublic({
          category: query.category,
          featured: query.featured === undefined ? undefined : query.featured === 'true',
        }),
      });
    },

    async getPublic(req, res) {
      const product = await service.getPublicBySlug(req.params.slug);
      if (!product) throw new HttpError(404, 'NOT_FOUND', 'Product not found.');
      res.status(200).json({ data: product });
    },

    async listAdmin(req, res) {
      res.status(200).json({
        data: await service.listAdmin(req.validatedQuery || {}),
      });
    },

    async getAdmin(req, res) {
      const product = await service.getById(parseId(req.params.id));
      if (!product) throw new HttpError(404, 'NOT_FOUND', 'Product not found.');
      res.status(200).json({ data: product });
    },

    async create(req, res) {
      const product = await service.create(req.validatedBody);
      res.status(201).json({ data: product });
    },

    async update(req, res) {
      const product = await service.update(
        parseId(req.params.id),
        req.validatedBody
      );
      if (!product) throw new HttpError(404, 'NOT_FOUND', 'Product not found.');
      res.status(200).json({ data: product });
    },

    async updateStatus(req, res) {
      const product = await service.updateStatus(
        parseId(req.params.id),
        req.validatedBody.status
      );
      if (!product) throw new HttpError(404, 'NOT_FOUND', 'Product not found.');
      res.status(200).json({ data: product });
    },
  };
}

module.exports = createProductsController;
