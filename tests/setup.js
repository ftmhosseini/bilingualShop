const { initDB, getPool } = require('../db');
const app = require('../app');

let db;

beforeAll(async () => {
  db = await initDB();
});

afterAll(async () => {
  const pool = await getPool();
  await pool.end();
});

module.exports = { app, getDb: () => db };
