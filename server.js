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
    APP_TITLE:     dbCfg.APP_TITLE   || process.env.APP_TITLE   || 'SmartNode — Decentralized FIFO Matrix on Solana',
    HERO_TITLE:    dbCfg.HERO_TITLE    || 'A Transparent, Automated Matrix Network Built on Solana',
    HERO_SUBTITLE: dbCfg.HERO_SUBTITLE || 'SmartNode is a peer-to-peer, 6-level FIFO payment matrix operating on the Solana blockchain. Participation is automated, positions are assigned in sequence, and payments flow directly between wallets — no central authority, no manual processing.',
    FEAT_1_ICON:   dbCfg.FEAT_1_ICON  || '⚙️',
    FEAT_1_TITLE:  dbCfg.FEAT_1_TITLE || 'Fully Automated',
    FEAT_1_TEXT:   dbCfg.FEAT_1_TEXT  || 'No administrators make decisions. Payment routing and position progression follow smart contract rules exclusively — enforced by code.',
    FEAT_2_ICON:   dbCfg.FEAT_2_ICON  || '◎',
    FEAT_2_TITLE:  dbCfg.FEAT_2_TITLE || 'FIFO Queue — Sequential by Design',
    FEAT_2_TEXT:   dbCfg.FEAT_2_TEXT  || 'Every position is processed in the exact order it was registered. The queue is fixed, transparent, and predictable.',
    FEAT_3_ICON:   dbCfg.FEAT_3_ICON  || '💸',
    FEAT_3_TITLE:  dbCfg.FEAT_3_TITLE || 'Direct Peer-to-Peer Payments',
    FEAT_3_TEXT:   dbCfg.FEAT_3_TEXT  || 'USDT is sent directly from one wallet to another. SmartNode does not hold, pool, or intermediate any funds at any stage.',
    HOW_TITLE:     dbCfg.HOW_TITLE    || 'How SmartNode Works',
    HOW_SUBTITLE:  dbCfg.HOW_SUBTITLE || 'Three structured steps to participate in the network',
    HOW_1:         dbCfg.HOW_1 || 'Connect your Solana-compatible wallet and register a unique node identity in the network.',
    HOW_2:         dbCfg.HOW_2 || 'Complete the system activation and unlock your 6 upline levels through sequential direct USDT payments — each sent directly to the corresponding wallet.',
    HOW_3:         dbCfg.HOW_3 || 'Once active, your node enters the live FIFO queue. Payments progress automatically as new participants join through your referral link.',
    HOW_STEP_1:    dbCfg.HOW_STEP_1 || 'Register',
    HOW_STEP_2:    dbCfg.HOW_STEP_2 || 'Activate',
    HOW_STEP_3:    dbCfg.HOW_STEP_3 || 'Participate',
    CTA_JOIN:      dbCfg.CTA_JOIN    || 'Understand the System →',
    CTA_WALLET:    dbCfg.CTA_WALLET  || 'Connect Wallet',
    STAT_1_LBL:    dbCfg.STAT_1_LBL || 'Active Nodes',
    STAT_2_LBL:    dbCfg.STAT_2_LBL || 'Matrix Levels',
    STAT_3_LBL:    dbCfg.STAT_3_LBL || 'USDT Per Level',
    STAT_4_LBL:    dbCfg.STAT_4_LBL || 'Solana Network',
    REG_TITLE:     dbCfg.REG_TITLE   || 'Register Your Node',
    REG_SUBTITLE:  dbCfg.REG_SUBTITLE|| 'Free registration — activation payments completed on the next step.',
    DASH_TITLE:    dbCfg.DASH_TITLE  || 'Node Dashboard',
    DASH_SUBTITLE: dbCfg.DASH_SUBTITLE||'Activate your matrix levels to enable payment reception',
    REF_LOCKED_TXT:dbCfg.REF_LOCKED_TXT||'Your referral link becomes available once all activation payments are complete — system fee + all 6 levels.',
    FOOTER_TEXT:   dbCfg.FOOTER_TEXT || 'SmartNode is a decentralized peer-to-peer matrix participation system. It is not an investment product, savings account, or regulated financial service. All payments are final and non-refundable. Participation does not guarantee income, returns, or profitability of any kind.',
    THEME:         dbCfg.THEME || process.env.THEME || '1',
    COUNTRY_L1: dbCfg.COUNTRY_L1 || '',
    COUNTRY_L2: dbCfg.COUNTRY_L2 || '',
    COUNTRY_L3: dbCfg.COUNTRY_L3 || '',
    COUNTRY_L4: dbCfg.COUNTRY_L4 || '',
    COUNTRY_L5: dbCfg.COUNTRY_L5 || '',
    COUNTRY_L6: dbCfg.COUNTRY_L6 || '',
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

app.delete('/api/admin/users/:username', adminAuth, async (req, res) => {
  try {
    const appCfg = buildAppConfig(await db.getConfig());
    if (appCfg.DEFAULT_MATRIX.includes(req.params.username))
      return res.status(403).json({ error: 'System nodes cannot be deleted' });
    await db.deleteUser(req.params.username);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/users/:username', adminAuth, async (req, res) => {
  try {
    const { walletAddress, fullName, nickname, address, phone, country, paidSystemFee, paidLevels } = req.body;
    const updates = {};
    if (walletAddress !== undefined) updates.walletAddress = walletAddress || null;
    if (fullName      !== undefined) updates.fullName      = fullName      || null;
    if (nickname      !== undefined) updates.nickname      = nickname      || null;
    if (address       !== undefined) updates.address       = address       || null;
    if (phone         !== undefined) updates.phone         = phone         || null;
    if (country       !== undefined) updates.country       = country       || null;
    if (paidSystemFee !== undefined) updates.paidSystemFee = Boolean(paidSystemFee);
    if (Array.isArray(paidLevels))   updates.paidLevels    = paidLevels.map(Number).filter(n => n >= 1 && n <= 6);
    const user = await db.updateUser(req.params.username, updates);
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/create-user', adminAuth, async (req, res) => {
  try {
    let { username, walletAddress, country, referrer, customMatrix } = req.body;
    username = String(username || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
    if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
    if (await db.usernameExists(username)) return res.status(409).json({ error: `Username "${username}" already taken` });
    if (walletAddress && await db.walletExists(walletAddress)) return res.status(409).json({ error: 'Wallet already used' });

    let uplineMatrix;
    // customMatrix can be array of strings (legacy) or array of {username,wallet,country} objects
    const isObjectMatrix = Array.isArray(customMatrix) && customMatrix.length === 6 && typeof customMatrix[0] === 'object';
    const isStringMatrix = Array.isArray(customMatrix) && customMatrix.length === 6 && typeof customMatrix[0] === 'string';

    if (isObjectMatrix || isStringMatrix) {
      // Build upline from the provided entries
      uplineMatrix = customMatrix.map(entry => {
        const u = isObjectMatrix ? String(entry?.username || '') : String(entry || '');
        return u.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
      });

      // For object matrix: auto-create or update each level node
      if (isObjectMatrix) {
        for (const entry of customMatrix) {
          const lu = String(entry?.username || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
          if (!lu) continue;
          const lw = entry?.wallet ? String(entry.wallet).slice(0, 64) : null;
          const lc = entry?.country ? String(entry.country).slice(0, 4) : null;
          const ln = entry?.name ? String(entry.name).slice(0, 100) : null;
          const exists = await db.usernameExists(lu);
          if (!exists) {
            // Auto-create the level node with the default upline
            const appCfg = buildAppConfig(await db.getConfig());
            await db.createUser({ username: lu, walletAddress: lw, referrer: null, uplineMatrix: [...appCfg.DEFAULT_MATRIX] });
            const upd = {};
            if (lc) upd.country = lc;
            if (ln) upd.fullName = ln;
            if (Object.keys(upd).length) await db.updateUser(lu, upd);
          } else {
            // Update wallet/country/name if provided
            const updates = {};
            if (lw) updates.walletAddress = lw;
            if (lc) updates.country = lc;
            if (ln) updates.fullName = ln;
            if (Object.keys(updates).length) await db.updateUser(lu, updates);
          }
        }
      }
    } else {
      const appCfg = buildAppConfig(await db.getConfig());
      uplineMatrix = [...appCfg.DEFAULT_MATRIX];
      if (referrer) {
        const refUser = await db.getUser(referrer);
        if (refUser) uplineMatrix = [...refUser.uplineMatrix.slice(1), referrer];
      }
    }

    const user = await db.createUser({ username, walletAddress: walletAddress || null, referrer: referrer || null, uplineMatrix });
    // Apply country to the newly created node if provided
    const cleanCountry = country ? String(country).slice(0, 4) : null;
    if (cleanCountry) await db.updateUser(username, { country: cleanCountry });
    res.status(201).json({ ...user, country: cleanCountry });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Public API ────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try { res.json({ totalUsers: await db.countUsers() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Lookup user by wallet address
app.get('/api/wallet/:address', async (req, res) => {
  try {
    const user = await db.getUserByWallet(req.params.address);
    if (!user) return res.status(404).json({ error: 'Wallet not registered' });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
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

// Public profile endpoint (includes referral count, total received, matrix node details)
app.get('/api/profile/:username', async (req, res) => {
  try {
    const user = await db.getUser(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const [referralCount, totalReceivedCount] = await Promise.all([
      db.getReferralCount(req.params.username),
      db.getTotalReceived(req.params.username),
    ]);
    // Fetch public info for each upline matrix node
    const matrixInfo = {};
    await Promise.all(user.uplineMatrix.map(async uname => {
      const mu = await db.getUser(uname);
      if (mu) matrixInfo[uname] = { nickname: mu.nickname, country: mu.country, walletAddress: mu.walletAddress };
    }));
    res.json({ ...user, referralCount, totalReceivedCount, matrixInfo });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Matrix node public info (batch)
app.get('/api/matrix-nodes', async (req, res) => {
  try {
    const names = String(req.query.u || '').split(',').filter(Boolean).slice(0, 10);
    const info = {};
    await Promise.all(names.map(async uname => {
      const u = await db.getUser(uname);
      if (u) info[uname] = { nickname: u.nickname, country: u.country, walletAddress: u.walletAddress };
    }));
    res.json(info);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/register', async (req, res) => {
  try {
    let { username, walletAddress, referrer } = req.body;
    username = String(username || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
    if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
    if (await db.usernameExists(username)) return res.status(409).json({ error: `Username "${username}" is already taken` });
    if (walletAddress && await db.walletExists(walletAddress)) return res.status(409).json({ error: 'wallet_taken' });

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
    const { walletAddress, paidSystemFee, paidLevels, avatar, fullName, nickname, address, phone, country } = req.body;
    const user = await db.updateUser(req.params.username, { walletAddress, paidSystemFee, paidLevels, avatar, fullName, nickname, address, phone, country });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Full referral tree (direct + indirect up to 6 levels deep)
app.get('/api/referrals/:username', async (req, res) => {
  try {
    const user = await db.getUser(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // BFS to build downline tree, up to depth 6
    async function buildTree(uname, depth) {
      if (depth > 6) return [];
      const directs = await db.getDirectReferrals(uname);
      return Promise.all(directs.map(async r => ({
        username:    r.username,
        nickname:    r.nickname,
        country:     r.country,
        avatar:      r.avatar,
        walletAddress: r.walletAddress,
        paidSystemFee: r.paidSystemFee,
        paidLevels:  r.paidLevels,
        depth,
        children:    await buildTree(r.username, depth + 1),
      })));
    }
    const tree = await buildTree(req.params.username, 1);
    res.json(tree);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Matrices a user appears in, grouped by position
app.get('/api/my-matrices/:username', async (req, res) => {
  try {
    const user = await db.getUser(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(await db.getMatricesContaining(req.params.username));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
db.migrate().then(() => {
  app.listen(PORT, () => console.log(`SmartNode → http://localhost:${PORT}`));
}).catch(err => { console.error('[startup]', err.message); process.exit(1); });
