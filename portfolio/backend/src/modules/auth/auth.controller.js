const HttpError = require('../../utils/http-error');

function createAuthController(service) {
  return {
    async login(req, res) {
      const result = await service.login(
        req.validatedBody.email.toLowerCase(),
        req.validatedBody.password
      );
      if (!result) {
        throw new HttpError(
          401,
          'INVALID_CREDENTIALS',
          'Email or password is incorrect.'
        );
      }
      res.status(200).json({ data: result });
    },

    async me(req, res) {
      const admin = await service.getAdminById(req.admin.id);
      if (!admin) {
        throw new HttpError(
          401,
          'UNAUTHENTICATED',
          'The admin account is no longer available.'
        );
      }
      res.status(200).json({ data: admin });
    },
  };
}

module.exports = createAuthController;
