const HttpError = require('../utils/http-error');
const { validationDetails } = require('../utils/validation');

function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new HttpError(
        400,
        'VALIDATION_ERROR',
        'Request validation failed.',
        validationDetails(result.error.issues)
      ));
    }

    req.validatedBody = result.data;
    return next();
  };
}

module.exports = { validateBody };