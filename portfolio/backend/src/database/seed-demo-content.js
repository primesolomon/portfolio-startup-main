require('dotenv').config();

const path = require('node:path');
const fs = require('node:fs/promises');
const pool = require('../config/database');

async function seedDemoContent() {
  const sqlPath = path.resolve(__dirname, '../../database/seeds/demo-content.sql');
  const sql = await fs.readFile(sqlPath, 'utf8');
  try {
    for (const statement of sql.split(';').map((item) => item.trim()).filter(Boolean)) {
      await pool.query(statement);
    }
    console.log('Demo site content has been added where content was empty.');
  } finally {
    await pool.end();
  }
}

seedDemoContent().catch((error) => {
  console.error('Could not seed demo content.', error);
  process.exitCode = 1;
});
