const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

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
      avatar            VARCHAR(10)  NOT NULL DEFAULT '👤',
      registration_date TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_referrer ON users(referrer);

    -- Add avatar column if upgrading from older schema
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(10) NOT NULL DEFAULT '👤';

    -- Add profile info columns if upgrading from older schema
    ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name   VARCHAR(100) NOT NULL DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname    VARCHAR(50)  NOT NULL DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS user_address TEXT        NOT NULL DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone       VARCHAR(30)  NOT NULL DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS country     VARCHAR(60)  NOT NULL DEFAULT '';

    CREATE TABLE IF NOT EXISTS site_config (
      key   VARCHAR(64) PRIMARY KEY,
      value TEXT        NOT NULL
    );
  `);
  console.log('[db] Tables ready');
}

function normalize(row) {
  if (!row) return null;
  return {
    username:         row.username,
    walletAddress:    row.wallet_address,
    referrer:         row.referrer,
    uplineMatrix:     row.upline_list,
    paidSystemFee:    row.paid_system_fee,
    paidLevels:       row.paid_levels,
    avatar:           row.avatar || '👤',
    fullName:         row.full_name    || '',
    nickname:         row.nickname     || '',
    address:          row.user_address || '',
    phone:            row.phone        || '',
    country:          row.country      || '',
    registrationDate: row.registration_date,
  };
}

async function getUser(username) {
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return normalize(rows[0]);
}

async function getUserByWallet(walletAddress) {
  const { rows } = await pool.query('SELECT * FROM users WHERE wallet_address = $1', [walletAddress]);
  return normalize(rows[0]);
}

async function walletExists(walletAddress) {
  const { rows } = await pool.query('SELECT 1 FROM users WHERE wallet_address = $1', [walletAddress]);
  return rows.length > 0;
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

async function updateUser(username, { walletAddress, paidSystemFee, paidLevels, avatar, fullName, nickname, address, phone, country }) {
  const sets = [], vals = [];
  let i = 1;
  if (walletAddress !== undefined) { sets.push(`wallet_address = $${i++}`);  vals.push(walletAddress); }
  if (paidSystemFee !== undefined) { sets.push(`paid_system_fee = $${i++}`); vals.push(paidSystemFee); }
  if (paidLevels    !== undefined) { sets.push(`paid_levels = $${i++}`);     vals.push(JSON.stringify(paidLevels)); }
  if (avatar        !== undefined) { sets.push(`avatar = $${i++}`);          vals.push(avatar); }
  if (fullName      !== undefined) { sets.push(`full_name = $${i++}`);       vals.push(fullName); }
  if (nickname      !== undefined) { sets.push(`nickname = $${i++}`);        vals.push(nickname); }
  if (address       !== undefined) { sets.push(`user_address = $${i++}`);    vals.push(address); }
  if (phone         !== undefined) { sets.push(`phone = $${i++}`);           vals.push(phone); }
  if (country       !== undefined) { sets.push(`country = $${i++}`);         vals.push(country); }
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
  const { rows } = await pool.query('SELECT * FROM users ORDER BY registration_date DESC');
  return rows.map(normalize);
}

async function getReferralCount(username) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) AS n FROM users WHERE referrer = $1', [username]
  );
  return parseInt(rows[0].n, 10);
}

async function getConfig() {
  const { rows } = await pool.query('SELECT key, value FROM site_config');
  const cfg = {};
  rows.forEach(r => { cfg[r.key] = r.value; });
  return cfg;
}

async function getMatricesContaining(username) {
  const { rows } = await pool.query(
    'SELECT username, upline_list, paid_levels, avatar, nickname, country, wallet_address FROM users ORDER BY registration_date DESC'
  );
  const result = { L1:[], L2:[], L3:[], L4:[], L5:[], L6:[] };
  for (const row of rows) {
    const ul = Array.isArray(row.upline_list) ? row.upline_list : [];
    ul.forEach((name, idx) => {
      if (name === username) {
        result[`L${idx + 1}`].push({
          username:     row.username,
          uplineMatrix: ul,
          paidLevels:   Array.isArray(row.paid_levels) ? row.paid_levels : [],
          avatar:       row.avatar || '👤',
          nickname:     row.nickname || '',
          country:      row.country || '',
          walletAddress: row.wallet_address || '',
          myPosition:   idx,
        });
      }
    });
  }
  return result;
}

async function getTotalReceived(username) {
  const { rows } = await pool.query('SELECT upline_list, paid_levels FROM users');
  let count = 0;
  for (const row of rows) {
    const ul = Array.isArray(row.upline_list) ? row.upline_list : [];
    const pl = Array.isArray(row.paid_levels) ? row.paid_levels : [];
    ul.forEach((name, idx) => { if (name === username && pl.includes(idx)) count++; });
  }
  return count;
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
  getUser, usernameExists, createUser, updateUser,
  countUsers, getAllUsers, getReferralCount, getTotalReceived, getMatricesContaining,
  getUserByWallet, walletExists,
  getConfig, setConfigBulk,
};
