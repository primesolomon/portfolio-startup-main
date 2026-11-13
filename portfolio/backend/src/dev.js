require('dotenv').config();

const express = require('express');
const path = require('node:path');
const app = require('./app');
const pool = require('./config/database');

function readPort(name, fallback) {
  const port = Number(process.env[name] || fallback);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} must be a valid port number.`);
  }
  return port;
}

const apiPort = readPort('PORT', 3000);
const frontendPort = readPort('FRONTEND_PORT', 8765);
const frontendDirectory = path.resolve(__dirname, '../../frontend/vanilla');
const frontendApp = express();

frontendApp.use(express.static(frontendDirectory, { index: 'index.html' }));
frontendApp.use((req, res, next) => {
  if (req.method !== 'GET' || path.extname(req.path)) return next();
  return res.sendFile(path.join(frontendDirectory, 'index.html'), (error) => {
    if (error) next(error);
  });
});

async function startServers() {
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    console.error('Could not connect to the database; servers were not started.', error);
    await pool.end();
    process.exitCode = 1;
    return;
  }

  const apiServer = app.listen(apiPort, () => {
    console.log(`API server listening on port ${apiPort}.`);
  });
  const frontendServer = frontendApp.listen(frontendPort, '127.0.0.1', () => {
    console.log(`Frontend available at http://127.0.0.1:${frontendPort}/.`);
  });

  let shuttingDown = false;
  async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    await Promise.all([
      new Promise((resolve) => apiServer.close(resolve)),
      new Promise((resolve) => frontendServer.close(resolve)),
    ]);
    await pool.end();
  }

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

startServers();
