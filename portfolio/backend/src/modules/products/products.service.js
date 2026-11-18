const HttpError = require('../../utils/http-error');
const { validationDetails } = require('../../utils/validation');
const { createProductSchema } = require('./products.schema');
const defaultRepository = require('./products.repository');

function editableProduct(product) {
  const {
    title,
    slug,
    summary,
    description,
    coverImageUrl,
    category,
    projectUrl,
    repositoryUrl,
    featured,
  } = product;
  return {
    title,
    slug,
    summary,
    description,
    coverImageUrl,
    category,
    projectUrl,
    repositoryUrl,
    featured,
  };
}

function validatePublish(product) {
  const result = createProductSchema.safeParse(editableProduct(product));
  if (!result.success) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      'Product cannot be published until its required content is valid.',
      validationDetails(result.error.issues)
    );
  }
}

function rethrowConflict(error) {
  if (error.code === 'ER_DUP_ENTRY') {
    throw new HttpError(409, 'CONFLICT', 'A product with this slug already exists.');
  }
  throw error;
}

function createProductService(repository = defaultRepository) {
  async function listPublic(filters) {
    return repository.listPublic(filters);
  }

  async function listAdmin(filters) {
    return repository.listAdmin(filters);
  }

  async function getPublicBySlug(slug) {
    return repository.findPublicBySlug(slug);
  }

  async function getById(id) {
    return repository.findById(id);
  }

  async function create(product) {
    try {
      return await repository.create(product);
    } catch (error) {
      rethrowConflict(error);
    }
  }

  async function update(id, updates) {
    if (!await repository.findById(id)) return null;
    try {
      return await repository.update(id, updates);
    } catch (error) {
      rethrowConflict(error);
    }
  }

  async function updateStatus(id, status) {
    try {
      return await repository.updateStatus(id, status, validatePublish);
    } catch (error) {
      rethrowConflict(error);
    }
  }

  return {
    listPublic,
    listAdmin,
    getPublicBySlug,
    getById,
    create,
    update,
    updateStatus,
  };
}

module.exports = {
  ...createProductService(),
  createProductService,
};