require('dotenv').config();
process.env.DB_HOST ||= '127.0.0.1';
process.env.DB_USER ||= 'test';
process.env.DB_NAME ||= 'test';
process.env.JWT_SECRET ||= 'test-only-jwt-secret-with-at-least-32-characters';

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { createApp } = require('../src/app');

const adminToken = jwt.sign(
  { sub: '17' },
  process.env.JWT_SECRET,
  { expiresIn: 3600 }
);

const sampleProduct = {
  id: 8,
  title: 'Example Product',
  slug: 'example-product',
  summary: 'An example product summary.',
  description: 'A complete example product description.',
  coverImageUrl: null,
  category: 'Analytics',
  projectUrl: null,
  repositoryUrl: null,
  featured: false,
  status: 'draft',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const content = {
  startup: { name: 'Example', tagline: '', description: '' },
  founders: [],
  about: { heading: '', body: '' },
  contact: { heading: '', body: '', email: null, phone: null },
};

const services = {
  auth: {
    async login(email) {
      return {
        accessToken: 'test-token',
        tokenType: 'Bearer',
        expiresInSeconds: 3600,
        admin: { id: 17, name: 'Test Admin', email },
      };
    },
    async getAdminById() {
      return { id: 17, name: 'Test Admin', email: 'admin@example.com' };
    },
  },
  products: {
    async listPublic(filters) {
      services.lastPublicFilters = filters;
      return [sampleProduct];
    },
    async getPublicBySlug(slug) {
      return slug === sampleProduct.slug ? { ...sampleProduct, status: 'published' } : null;
    },
    async listAdmin(filters) {
      services.lastAdminFilters = filters;
      return [sampleProduct];
    },
    async getById(id) {
      return id === sampleProduct.id ? sampleProduct : null;
    },
    async create(product) {
      services.lastCreatedProduct = product;
      return { ...sampleProduct, ...product };
    },
    async update(id, updates) {
      return id === sampleProduct.id ? { ...sampleProduct, ...updates } : null;
    },
    async updateStatus(id, status) {
      return id === sampleProduct.id ? { ...sampleProduct, status } : null;
    },
  },
  siteContent: {
    async get() {
      return content;
    },
    async save(patch) {
      services.lastContentPatch = patch;
      return { ...content, ...patch };
    },
  },
  contact: {
    async send(message) {
      services.lastMessage = message;
    },
  },
  uploads: {
    async store(file) {
      services.lastUpload = file;
      return { url: 'http://localhost:3000/uploads/product-covers/test.png' };
    },
  },
};

const app = createApp(services);

test('public endpoints return contract data and apply public filters', async () => {
  const siteResponse = await request(app).get('/api/site-content').expect(200);
  assert.deepEqual(siteResponse.body.data, content);

  const productsResponse = await request(app)
    .get('/api/products?category=Analytics&featured=true')
    .expect(200);
  assert.equal(productsResponse.body.data[0].slug, 'example-product');
  assert.deepEqual(services.lastPublicFilters, {
    category: 'Analytics',
    featured: true,
  });

  await request(app).get('/api/products/unpublished').expect(404);
  await request(app).get('/api/products?category=not-real').expect(400);
});

test('admin endpoints require a bearer token and validate product payloads', async () => {
  await request(app).get('/api/admin/products').expect(401);
  await request(app)
    .get('/api/admin/products')
    .set('Authorization', 'Bearer invalid')
    .expect(401);

  const listResponse = await request(app)
    .get('/api/admin/products?status=draft')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);
  assert.equal(listResponse.body.data[0].status, 'draft');
  assert.deepEqual(services.lastAdminFilters, { status: 'draft' });

  const invalid = await request(app)
    .post('/api/admin/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ ...sampleProduct, status: 'published' })
    .expect(400);
  assert.equal(invalid.body.error.code, 'VALIDATION_ERROR');
  assert.equal(services.lastCreatedProduct, undefined);
});

test('admin product create always starts as draft and status is changed separately', async () => {
  const { id, status, createdAt, updatedAt, ...product } = sampleProduct;
  const created = await request(app)
    .post('/api/admin/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(product)
    .expect(201);
  assert.equal(created.body.data.status, 'draft');
  assert.equal(services.lastCreatedProduct.featured, false);

  const changed = await request(app)
    .patch('/api/admin/products/8/status')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'archived' })
    .expect(200);
  assert.equal(changed.body.data.status, 'archived');
});

test('content updates and contact submissions use the agreed envelopes', async () => {
  const patch = { about: { heading: 'About', body: 'Our story.' } };
  await request(app)
    .patch('/api/admin/site-content')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(patch)
    .expect(200);
  assert.deepEqual(services.lastContentPatch, patch);

  const message = {
    name: 'Visitor',
    email: 'visitor@example.com',
    message: 'Please tell me more about your work.',
  };
  const response = await request(app)
    .post('/api/contact-messages')
    .send(message)
    .expect(202);
  assert.equal(response.body.data.accepted, true);
  assert.deepEqual(services.lastMessage, message);

  const invalid = await request(app)
    .post('/api/contact-messages')
    .send({ ...message, message: 'short' })
    .expect(400);
  assert.equal(invalid.body.error.code, 'VALIDATION_ERROR');
});

test('cover upload requires authentication and enforces the request file size', async () => {
  await request(app)
    .post('/api/admin/uploads/product-cover')
    .attach('file', Buffer.from('small'), { filename: 'cover.png', contentType: 'image/png' })
    .expect(401);

  const uploaded = await request(app)
    .post('/api/admin/uploads/product-cover')
    .set('Authorization', `Bearer ${adminToken}`)
    .attach('file', Buffer.from('small'), { filename: 'cover.png', contentType: 'image/png' })
    .expect(201);
  assert.match(uploaded.body.data.url, /^http:\/\/localhost:3000\/uploads\/product-covers\//);

  const oversized = await request(app)
    .post('/api/admin/uploads/product-cover')
    .set('Authorization', `Bearer ${adminToken}`)
    .attach('file', Buffer.alloc(4 * 1024 * 1024 + 1), { filename: 'large.png', contentType: 'image/png' })
    .expect(413);
  assert.equal(oversized.body.error.code, 'FILE_TOO_LARGE');
});
