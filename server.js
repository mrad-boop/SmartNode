require('dotenv').config();
const express = require('express');
const path    = require('path');
const db      = require('./db');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Config builder ────────────────────────────────────────────
function buildAppConfig(dbCfg) {
  const m = [
    dbCfg.MATRIX_L1 || process.env.MATRIX_L1 || 'Admin_Node',
    dbCfg.MATRIX_L2 || process.env.MATRIX_L2 || 'System_Link',
    dbCfg.MATRIX_L3 || process.env.MATRIX_L3 || 'Global_Alpha',
    dbCfg.MATRIX_L4 || process.env.MATRIX_L4 || 'DeFi_Master',
    dbCfg.MATRIX_L5 || process.env.MATRIX_L5 || 'Prime_Core',
    dbCfg.MATRIX_L6 || process.env.MATRIX_L6 || 'Support_Level',
  ];
  return {
    APP_NAME:      dbCfg.APP_NAME    || process.env.APP_NAME    || 'SmartNode',
    APP_TITLE:     dbCfg.APP_TITLE   || process.env.APP_TITLE   || 'SmartNode — DeFi Matrix',
    HERO_TITLE:    dbCfg.HERO_TITLE    || 'The DeFi Matrix Network',
    HERO_SUBTITLE: dbCfg.HERO_SUBTITLE || 'Earn passive income through a decentralized 6-level FIFO referral matrix on Solana. Join thousands of nodes worldwide.',
    FEAT_1_ICON:   dbCfg.FEAT_1_ICON  || '⬡',
    FEAT_1_TITLE:  dbCfg.FEAT_1_TITLE || '6-Level Matrix',
    FEAT_1_TEXT:   dbCfg.FEAT_1_TEXT  || 'Every node connects to 6 upline levels. Payments flow automatically through the chain.',
    FEAT_2_ICON:   dbCfg.FEAT_2_ICON  || '◎',
    FEAT_2_TITLE:  dbCfg.FEAT_2_TITLE || 'Solana Powered',
    FEAT_2_TEXT:   dbCfg.FEAT_2_TEXT  || 'Built on Solana for near-zero fees and instant transactions. Connect with Phantom wallet.',
    FEAT_3_ICON:   dbCfg.FEAT_3_ICON  || '⚡',
    FEAT_3_TITLE:  dbCfg.FEAT_3_TITLE || 'Instant Payments',
    FEAT_3_TEXT:   dbCfg.FEAT_3_TEXT  || 'USDT payments go directly to upline wallets. No middlemen, no delays.',
    HOW_1:         dbCfg.HOW_1 || 'Connect your Phantom wallet and choose a username to register your node.',
    HOW_2:         dbCfg.HOW_2 || 'Pay the system activation fee and unlock each of your 6 upline levels.',
    HOW_3:         dbCfg.HOW_3 || 'Share your referral link. Every new node you bring earns you a level payment.',
    FOOTER_TEXT:   dbCfg.FOOTER_TEXT || 'SmartNode is a decentralized peer-to-peer matrix system. Payments are final and non-refundable.',
    SYSTEM_FEE_ADDRESS: dbCfg.SYSTEM_FEE_ADDRESS || process.env.SYSTEM_FEE_ADDRESS || '',
    SYSTEM_FEE_AMOUNT:  Number(dbCfg.SYSTEM_FEE_AMOUNT || process.env.SYSTEM_FEE_AMOUNT || 10),
    LEVEL_AMOUNT:       Number(dbCfg.LEVEL_AMOUNT      || process.env.LEVEL_AMOUNT      || 5),
    DEFAULT_MATRIX: m,
    SYSTEM_WALLETS: {
      [m[0]]: dbCfg.WALLET_L1 || process.env.WALLET_L1 || '',
      [m[1]]: dbCfg.WALLET_L2 || process.env.WALLET_L2 || '',
      [m[2]]: dbCfg.WALLET_L3 || process.env.WALLET_L3 || '',
      [m[3]]: dbCfg.WALLET_L4 || process.env.WALLET_L4 || '',
      [m[4]]: dbCfg.WALLET_L5 || process.env.WALLET_L5 || '',
      [m[5]]: dbCfg.WALLET_L6 || process.env.WALLET_L6 || '',
    },
    // Hidden admin URL token (change CONTROL_TOKEN env var to keep it secret)
    CONTROL_TOKEN: process.env.CONTROL_TOKEN || 'node-matrix-sys',
  };
}

// ── /config.js ────────────────────────────────────────────────
app.get('/config.js', async (req, res) => {
  try {
    const cfg = buildAppConfig(await db.getConfig());
    res.type('application/javascript');
    res.send(`window.APP_CONFIG = ${JSON.stringify(cfg)};`);
  } catch {
    res.type('application/javascript');
    res.send(`window.APP_CONFIG = ${JSON.stringify(buildAppConfig({}))};`);
  }
});

// ── Admin auth ────────────────────────────────────────────────
function adminAuth(req, res, next) {
  const pwd = req.headers['x-admin-password'];
  if (pwd !== (process.env.ADMIN_PASSWORD || 'smartnode_admin_2024')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password !== (process.env.ADMIN_PASSWORD || 'smartnode_admin_2024'))
    return res.status(401).json({ error: 'Wrong password' });
  res.json({ ok: true });
});

app.get('/api/admin/config', adminAuth, async (req, res) => {
  try { res.json(buildAppConfig(await db.getConfig())); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/config', adminAuth, async (req, res) => {
  try { await db.setConfigBulk(req.body); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
  try { res.json(await db.getAllUsers()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Public API ────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try { res.json({ totalUsers: await db.countUsers() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/check/:username', async (req, res) => {
  try { res.json({ available: !(await db.usernameExists(req.params.username)) }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/user/:username', async (req, res) => {
  try {
    const user = await db.getUser(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Public profile endpoint (includes referral count)
app.get('/api/profile/:username', async (req, res) => {
  try {
    const user = await db.getUser(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const referralCount = await db.getReferralCount(req.params.username);
    res.json({ ...user, referralCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/register', async (req, res) => {
  try {
    let { username, walletAddress, referrer } = req.body;
    username = String(username || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
    if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
    if (await db.usernameExists(username)) return res.status(409).json({ error: `Username "${username}" is already taken` });

    const appCfg = buildAppConfig(await db.getConfig());
    let uplineMatrix = [...appCfg.DEFAULT_MATRIX];
    if (referrer) {
      const refUser = await db.getUser(referrer);
      if (refUser) uplineMatrix = [...refUser.uplineMatrix.slice(1), referrer];
    }
    const user = await db.createUser({ username, walletAddress, referrer, uplineMatrix });
    res.status(201).json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/user/:username', async (req, res) => {
  try {
    const { walletAddress, paidSystemFee, paidLevels, avatar } = req.body;
    const user = await db.updateUser(req.params.username, { walletAddress, paidSystemFee, paidLevels, avatar });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
db.migrate().then(() => {
  app.listen(PORT, () => console.log(`SmartNode → http://localhost:${PORT}`));
}).catch(err => { console.error('[startup]', err.message); process.exit(1); });
