// ── SmartNode — PostgreSQL Database Layer ───────────────────
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ── Migrations ───────────────────────────────────────────────
async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id                SERIAL PRIMARY KEY,
      username          VARCHAR(20)  UNIQUE NOT NULL,
      wallet_address    VARCHAR(64),
      referrer          VARCHAR(20),
      upline_list       JSONB        NOT NULL DEFAULT '[]',
      paid_system_fee   BOOLEAN      NOT NULL DEFAULT FALSE,
      paid_levels       JSONB        NOT NULL DEFAULT '[]',
      registration_date TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_referrer ON users(referrer);

    CREATE TABLE IF NOT EXISTS site_config (
      key   VARCHAR(64) PRIMARY KEY,
      value TEXT        NOT NULL
    );
  `);
  console.log('[db] Tables ready');
}

// ── Normalize user row ───────────────────────────────────────
function normalize(row) {
  if (!row) return null;
  return {
    username:         row.username,
    walletAddress:    row.wallet_address,
    referrer:         row.referrer,
    uplineMatrix:     row.upline_list,
    paidSystemFee:    row.paid_system_fee,
    paidLevels:       row.paid_levels,
    registrationDate: row.registration_date,
  };
}

// ── User queries ─────────────────────────────────────────────
async function getUser(username) {
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return normalize(rows[0]);
}

async function usernameExists(username) {
  const { rows } = await pool.query('SELECT 1 FROM users WHERE username = $1', [username]);
  return rows.length > 0;
}

async function createUser({ username, walletAddress, referrer, uplineMatrix }) {
  const { rows } = await pool.query(
    `INSERT INTO users (username, wallet_address, referrer, upline_list)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [username, walletAddress || null, referrer || null, JSON.stringify(uplineMatrix)]
  );
  return normalize(rows[0]);
}

async function updateUser(username, { walletAddress, paidSystemFee, paidLevels }) {
  const sets = [], vals = [];
  let i = 1;
  if (walletAddress !== undefined) { sets.push(`wallet_address = $${i++}`);  vals.push(walletAddress); }
  if (paidSystemFee !== undefined) { sets.push(`paid_system_fee = $${i++}`); vals.push(paidSystemFee); }
  if (paidLevels    !== undefined) { sets.push(`paid_levels = $${i++}`);     vals.push(JSON.stringify(paidLevels)); }
  if (!sets.length) return getUser(username);
  vals.push(username);
  const { rows } = await pool.query(
    `UPDATE users SET ${sets.join(', ')} WHERE username = $${i} RETURNING *`, vals
  );
  return normalize(rows[0]);
}

async function countUsers() {
  const { rows } = await pool.query('SELECT COUNT(*) AS n FROM users');
  return parseInt(rows[0].n, 10);
}

async function getAllUsers() {
  const { rows } = await pool.query(
    'SELECT * FROM users ORDER BY registration_date DESC'
  );
  return rows.map(normalize);
}

// ── Site config queries ──────────────────────────────────────
async function getConfig() {
  const { rows } = await pool.query('SELECT key, value FROM site_config');
  const cfg = {};
  rows.forEach(r => { cfg[r.key] = r.value; });
  return cfg;
}

async function setConfigBulk(entries) {
  for (const [key, value] of Object.entries(entries)) {
    await pool.query(
      `INSERT INTO site_config (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [key, String(value)]
    );
  }
}

module.exports = {
  migrate,
  getUser, usernameExists, createUser, updateUser, countUsers, getAllUsers,
  getConfig, setConfigBulk,
};
