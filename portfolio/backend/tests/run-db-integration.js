const { spawnSync } = require('node:child_process');

const result = spawnSync(
  process.execPath,
  ['--test', 'tests/db.integration.test.js'],
  {
    cwd: process.cwd(),
    env: { ...process.env, RUN_DB_INTEGRATION: 'true' },
    stdio: 'inherit',
  }
);

if (result.error) {
  console.error('Could not start the database integration test.', result.error);
  process.exitCode = 1;
} else {
  process.exitCode = result.status === null ? 1 : result.status;
}
