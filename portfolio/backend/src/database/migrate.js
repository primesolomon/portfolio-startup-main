require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const pool = require('../config/database');

const databaseRoot = path.resolve(__dirname, '../../database');

function splitStatements(sql) {
  return sql.split(';').map((statement) => statement.trim()).filter(Boolean);
}

async function runSqlFile(filePath) {
  const contents = await fs.readFile(filePath, 'utf8');
  for (const statement of splitStatements(contents)) {
    await pool.query(statement);
  }
}

async function migrate() {
  try {
    await runSqlFile(path.join(databaseRoot, 'schema.sql'));
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(190) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const migrationDirectory = path.join(databaseRoot, 'migrations');
    const files = (await fs.readdir(migrationDirectory))
      .filter((name) => /^\d+[-_].+\.sql$/.test(name))
      .sort();
    const [appliedRows] = await pool.query('SELECT name FROM schema_migrations');
    const applied = new Set(appliedRows.map((row) => row.name));

    for (const file of files) {
      if (applied.has(file)) continue;
      await runSqlFile(path.join(migrationDirectory, file));
      await pool.execute('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
      console.log(`Applied migration ${file}.`);
    }
    console.log('Database schema is up to date.');
  } finally {
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('Database migration failed.', error);
  process.exitCode = 1;
});
