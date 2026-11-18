function createSiteContentController(service) {
  return {
    async get(req, res) {
      res.status(200).json({ data: await service.get() });
    },

    async update(req, res) {
      const content = await service.save(req.validatedBody);
      res.status(200).json({ data: content });
    },
  };
}

module.exports = createSiteContentController;
