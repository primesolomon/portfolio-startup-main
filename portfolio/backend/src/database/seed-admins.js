require('dotenv').config();

const bcrypt = require('bcryptjs');
const { z } = require('zod');
const pool = require('../config/database');

const adminSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    'Password must be 72 bytes or fewer.'
  ),
});

function readAdmin(index) {
  const value = {
    name: process.env[`ADMIN_${index}_NAME`],
    email: process.env[`ADMIN_${index}_EMAIL`],
    password: process.env[`ADMIN_${index}_PASSWORD`],
  };
  const result = adminSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`ADMIN_${index} configuration is incomplete or invalid.`);
  }
  return { ...result.data, email: result.data.email.toLowerCase() };
}

async function seedAdmins() {
  const admins = [readAdmin(1), readAdmin(2)];
  if (admins[0].email === admins[1].email) {
    throw new Error('ADMIN_1_EMAIL and ADMIN_2_EMAIL must be different.');
  }

  try {
    for (const admin of admins) {
      const passwordHash = await bcrypt.hash(admin.password, 12);
      await pool.execute(
        `INSERT INTO admins (name, email, password_hash)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           password_hash = VALUES(password_hash),
           updated_at = CURRENT_TIMESTAMP`,
        [admin.name, admin.email, passwordHash]
      );
    }
    console.log('Both admin accounts have been provisioned.');
  } finally {
    await pool.end();
  }
}

seedAdmins().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
