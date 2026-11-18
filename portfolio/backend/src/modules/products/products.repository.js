const pool = require('../../config/database');

const fieldColumns = {
  title: 'title',
  slug: 'slug',
  summary: 'summary',
  description: 'description',
  coverImageUrl: 'cover_image_url',
  category: 'category',
  projectUrl: 'project_url',
  repositoryUrl: 'repository_url',
  featured: 'featured',
};

function mapProduct(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    category: row.category,
    projectUrl: row.project_url,
    repositoryUrl: row.repository_url,
    featured: Number(row.featured) === 1,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function listPublic({ category, featured } = {}) {
  let sql = `SELECT * FROM products WHERE status = 'published'`;
  const values = [];
  if (category) {
    sql += ' AND category = ?';
    values.push(category);
  }
  if (featured !== undefined) {
    sql += ' AND featured = ?';
    values.push(featured ? 1 : 0);
  }
  sql += ' ORDER BY updated_at DESC, id DESC';
  const [rows] = await pool.execute(sql, values);
  return rows.map(mapProduct);
}

async function listAdmin({ status } = {}) {
  let sql = 'SELECT * FROM products';
  const values = [];
  if (status) {
    sql += ' WHERE status = ?';
    values.push(status);
  }
  sql += ' ORDER BY updated_at DESC, id DESC';
  const [rows] = await pool.execute(sql, values);
  return rows.map(mapProduct);
}

async function findPublicBySlug(slug) {
  const [rows] = await pool.execute(
    "SELECT * FROM products WHERE slug = ? AND status = 'published' LIMIT 1",
    [slug]
  );
  return mapProduct(rows[0]);
}

async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM products WHERE id = ? LIMIT 1',
    [id]
  );
  return mapProduct(rows[0]);
}

async function create(product) {
  const [result] = await pool.execute(
    `INSERT INTO products
      (title, slug, summary, description, cover_image_url, category,
       project_url, repository_url, featured, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
    [
      product.title,
      product.slug,
      product.summary,
      product.description,
      product.coverImageUrl ?? null,
      product.category,
      product.projectUrl ?? null,
      product.repositoryUrl ?? null,
      product.featured ? 1 : 0,
    ]
  );
  return findById(result.insertId);
}

async function update(id, updates) {
  const entries = Object.entries(updates).filter(([field]) => fieldColumns[field]);
  if (!entries.length) return findById(id);
  const assignments = entries.map(([field]) => `${fieldColumns[field]} = ?`);
  const values = entries.map(([, value]) => value === undefined ? null : value);
  values.push(id);
  await pool.execute(
    `UPDATE products SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    values
  );
  return findById(id);
}

async function updateStatus(id, status, validatePublish) {
  const connection = await pool.getConnection();
  let transactionStarted = false;
  try {
    await connection.beginTransaction();
    transactionStarted = true;
    const [rows] = await connection.execute(
      'SELECT * FROM products WHERE id = ? FOR UPDATE',
      [id]
    );
    const product = mapProduct(rows[0]);
    if (!product) {
      await connection.rollback();
      transactionStarted = false;
      return null;
    }
    if (status === 'published') validatePublish(product);
    await connection.execute(
      'UPDATE products SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    await connection.commit();
    transactionStarted = false;
    return findById(id);
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  listPublic,
  listAdmin,
  findPublicBySlug,
  findById,
  create,
  update,
  updateStatus,
};