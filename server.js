// ── SmartNode — Express API Server ──────────────────────────
require('dotenv').config();
const express = require('express');
const path    = require('path');
const db      = require('./db');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Default matrix from env ──────────────────────────────────
function getDefaultMatrix() {
  return [
    process.env.MATRIX_L1 || 'Admin_Node',
    process.env.MATRIX_L2 || 'System_Link',
    process.env.MATRIX_L3 || 'Global_Alpha',
    process.env.MATRIX_L4 || 'DeFi_Master',
    process.env.MATRIX_L5 || 'Prime_Core',
    process.env.MATRIX_L6 || 'Support_Level',
  ];
}

function getSystemWallets() {
  const m = getDefaultMatrix();
  return {
    [m[0]]: process.env.WALLET_L1 || '',
    [m[1]]: process.env.WALLET_L2 || '',
    [m[2]]: process.env.WALLET_L3 || '',
    [m[3]]: process.env.WALLET_L4 || '',
    [m[4]]: process.env.WALLET_L5 || '',
    [m[5]]: process.env.WALLET_L6 || '',
  };
}

// ── /config.js — inject env vars into frontend ───────────────
app.get('/config.js', (req, res) => {
  res.type('application/javascript');
  res.send(
    `window.APP_CONFIG = ${JSON.stringify({
      APP_NAME:           process.env.APP_NAME           || 'SmartNode',
      APP_TITLE:          process.env.APP_TITLE          || 'SmartNode — DeFi Matrix',
      SYSTEM_FEE_ADDRESS: process.env.SYSTEM_FEE_ADDRESS || '',
      SYSTEM_FEE_AMOUNT:  Number(process.env.SYSTEM_FEE_AMOUNT) || 10,
      LEVEL_AMOUNT:       Number(process.env.LEVEL_AMOUNT)      || 10,
      DEFAULT_MATRIX:     getDefaultMatrix(),
      SYSTEM_WALLETS:     getSystemWallets(),
    })};`
  );
});

// ── GET /api/stats ───────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const totalUsers = await db.countUsers();
    res.json({ totalUsers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/check/:username ─────────────────────────────────
app.get('/api/check/:username', async (req, res) => {
  try {
    const taken = await db.usernameExists(req.params.username);
    res.json({ available: !taken });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/user/:username ──────────────────────────────────
app.get('/api/user/:username', async (req, res) => {
  try {
    const user = await db.getUser(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/register ───────────────────────────────────────
app.post('/api/register', async (req, res) => {
  try {
    let { username, walletAddress, referrer } = req.body;

    // Sanitize
    username = String(username || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
    if (username.length < 3)
      return res.status(400).json({ error: 'Username must be at least 3 characters' });

    if (await db.usernameExists(username))
      return res.status(409).json({ error: `Username "${username}" is already taken` });

    // ── FIFO Matrix Logic ──────────────────────────────────
    // If referrer exists in DB, inherit their matrix shifted by 1.
    // New matrix = [...referrerMatrix.slice(1), referrerUsername]
    let uplineMatrix = getDefaultMatrix();

    if (referrer) {
      const refUser = await db.getUser(referrer);
      if (refUser) {
        uplineMatrix = [...refUser.uplineMatrix.slice(1), referrer];
      }
      // If referrer not found, silently fall back to default matrix
    }

    const user = await db.createUser({ username, walletAddress, referrer, uplineMatrix });
    res.status(201).json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── PATCH /api/user/:username ────────────────────────────────
app.patch('/api/user/:username', async (req, res) => {
  try {
    const { walletAddress, paidSystemFee, paidLevels } = req.body;
    const user = await db.updateUser(req.params.username, {
      walletAddress,
      paidSystemFee,
      paidLevels,
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Catch-all: serve index.html for any unknown route ────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
db.migrate()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`SmartNode running → http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('[startup] DB migration failed:', err.message);
    process.exit(1);
  });
