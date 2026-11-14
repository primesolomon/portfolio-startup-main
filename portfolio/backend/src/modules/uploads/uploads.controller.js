function createUploadsController(service) {
  return {
    async create(req, res) {
      res.status(201).json({ data: await service.store(req.file) });
    },
  };
}

module.exports = createUploadsController;
