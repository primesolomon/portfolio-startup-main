require('dotenv').config();

const app = require('./app');
const pool = require('./config/database');
const { validateProductionConfig } = require('./config/production');

const port = Number(process.env.PORT || 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid port number.');
}

validateProductionConfig();

async function startServer() {
  let server;
  try {
    await pool.query('SELECT 1');

    server = app.listen(port, () => {
      console.log(`API server listening on port ${port}.`);
    });
    server.on('error', async (error) => {
      console.error('API server failed to listen.', error.message);
      process.exitCode = 1;
      await pool.end();
    });
  } catch (error) {
    console.error('Could not connect to the database; server was not started.', error.message);
    await pool.end();
    process.exitCode = 1;
    return;
  }

  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}; shutting down.`);
    const timeout = setTimeout(() => {
      console.error('Graceful shutdown timed out.');
      process.exit(1);
    }, 10000);
    timeout.unref();
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
    clearTimeout(timeout);
  }

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

startServer();