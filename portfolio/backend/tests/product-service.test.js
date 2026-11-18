process.env.DB_HOST ||= '127.0.0.1';
process.env.DB_USER ||= 'test';
process.env.DB_NAME ||= 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createProductService } = require('../src/modules/products/products.service');
const { createProductSchema } = require('../src/modules/products/products.schema');

test('product validation trims fields and rejects URLs outside HTTP(S)', () => {
  const result = createProductSchema.safeParse({
    title: '  Product title  ',
    slug: 'product-title',
    summary: 'Summary',
    description: 'Description',
    category: 'General',
    projectUrl: 'javascript:alert(1)',
  });
  assert.equal(result.success, false);

  const accepted = createProductSchema.parse({
    title: '  Product title  ',
    slug: 'product-title',
    summary: 'Summary',
    description: 'Description',
    category: 'General',
  });
  assert.equal(accepted.title, 'Product title');
  assert.equal(accepted.featured, false);
});

test('publishing rejects incomplete existing products and maps duplicate slugs', async () => {
  const invalidProduct = {
    title: '',
    slug: 'missing-title',
    summary: 'Summary',
    description: 'Description',
    category: 'General',
    coverImageUrl: null,
    projectUrl: null,
    repositoryUrl: null,
    featured: false,
  };
  const service = createProductService({
    async updateStatus(id, status, validatePublish) {
      if (status === 'published') validatePublish(invalidProduct);
      return { id, status };
    },
    async create() {
      const error = new Error('Duplicate');
      error.code = 'ER_DUP_ENTRY';
      throw error;
    },
  });

  await assert.rejects(
    service.updateStatus(4, 'published'),
    (error) => error.status === 400 && error.code === 'VALIDATION_ERROR'
  );
  await assert.rejects(
    service.create({}),
    (error) => error.status === 409 && error.code === 'CONFLICT'
  );
});
