require('dotenv').config();
process.env.DB_HOST ||= '127.0.0.1';
process.env.DB_USER ||= 'test';
process.env.DB_NAME ||= 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const pool = require('../src/config/database');
const app = require('../src/app');

const enabled = process.env.RUN_DB_INTEGRATION === 'true';
const testPassword = 'temporary-integration-password';

test.after(async () => {
  await pool.end();
});

test('database-backed admin, product, and public routes follow the contract', {
  skip: !enabled,
}, async () => {
  const suffix = crypto.randomUUID();
  const email = `integration-${suffix}@example.invalid`;
  const slug = `integration-${suffix}`;
  let productId = null;

  try {
    const passwordHash = await bcrypt.hash(testPassword, 4);
    await pool.execute(
      'INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)',
      ['Temporary integration admin', email, passwordHash]
    );

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password: testPassword })
      .expect(200);
    const token = login.body.data.accessToken;

    const siteContent = await request(app)
      .get('/api/site-content')
      .expect(200);
    await request(app)
      .patch('/api/admin/site-content')
      .set('Authorization', `Bearer ${token}`)
      .send({
        about: siteContent.body.data.about,
        founders: siteContent.body.data.founders,
      })
      .expect(200);

    const created = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Integration Product',
        slug,
        summary: 'A temporary integration-test product.',
        description: 'This product exists only while the integration test runs.',
        category: 'General',
      })
      .expect(201);
    productId = created.body.data.id;
    assert.equal(created.body.data.status, 'draft');

    await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Duplicate Integration Product',
        slug,
        summary: 'A duplicate slug must fail.',
        description: 'This duplicate record should never be created.',
        category: 'General',
      })
      .expect(409);

    await request(app).get(`/api/products/${slug}`).expect(404);
    await request(app)
      .patch(`/api/admin/products/${productId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'published' })
      .expect(200);

    const publicProduct = await request(app)
      .get(`/api/products/${slug}`)
      .expect(200);
    assert.equal(publicProduct.body.data.id, productId);
    assert.equal(publicProduct.body.data.status, 'published');

    await request(app)
      .patch(`/api/admin/products/${productId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ summary: 'Updated integration summary.' })
      .expect(200);
    await request(app)
      .get(`/api/products/${slug}`)
      .expect(200)
      .then((response) => {
        assert.equal(response.body.data.summary, 'Updated integration summary.');
      });

    await request(app)
      .patch(`/api/admin/products/${productId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'archived' })
      .expect(200);
    await request(app).get(`/api/products/${slug}`).expect(404);
  } finally {
    if (productId) {
      await pool.execute('DELETE FROM products WHERE id = ?', [productId]);
    }
    await pool.execute('DELETE FROM admins WHERE email = ?', [email]);
  }
});
