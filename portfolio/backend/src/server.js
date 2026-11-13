require('dotenv').config();

const app = require('./app');
const pool = require('./config/database');

const port = Number(process.env.PORT || 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid port number.');
}

async function startServer() {
  try {
    await pool.query('SELECT 1');

    app.listen(port, () => {
      console.log(`API server listening on port ${port}.`);
    });
  } catch (error) {
    console.error('Could not connect to the database; server was not started.', error);
    await pool.end();
    process.exitCode = 1;
  }
}

startServer();