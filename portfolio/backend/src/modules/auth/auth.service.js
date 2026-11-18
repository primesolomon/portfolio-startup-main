const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../config/database');
const getJwtConfig = require('../../config/jwt');

async function login(email, password) {
  const [rows] = await pool.execute(
    `SELECT id, name, email, password_hash
     FROM admins
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  const admin = rows[0];

  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
    return null;
  }

  const { secret, expiresInSeconds } = getJwtConfig();
  const accessToken = jwt.sign(
    { sub: String(admin.id) },
    secret,
    { expiresIn: expiresInSeconds }
  );

  return {
    accessToken,
    tokenType: 'Bearer',
    expiresInSeconds,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
    },
  };
}

async function getAdminById(id) {
  const [rows] = await pool.execute(
    'SELECT id, name, email FROM admins WHERE id = ? LIMIT 1',
    [id]
  );

  return rows[0] || null;
}

module.exports = { login, getAdminById };