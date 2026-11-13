function createContactController(service) {
  return {
    async create(req, res) {
      await service.send(req.validatedBody);
      res.status(202).json({
        data: {
          accepted: true,
          message: 'Your message has been sent.',
        },
      });
    },
  };
}

module.exports = createContactController;
