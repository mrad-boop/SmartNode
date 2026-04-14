#!/usr/bin/env node
/**
 * SmartNode — Build-time environment variable injector
 * Reads index.html, replaces {{PLACEHOLDER}} tokens with
 * values from process.env, writes dist/index.html.
 */

const fs   = require('fs');
const path = require('path');

// ── Defaults (used if env var not set) ──────────────────────
const DEFAULTS = {
  APP_NAME:           'SmartNode',
  APP_TITLE:          'SmartNode — DeFi Matrix',

  // System fee
  SYSTEM_FEE_ADDRESS: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  SYSTEM_FEE_AMOUNT:  '10',
  LEVEL_AMOUNT:       '10',

  // Default matrix usernames (Level 1 → 6)
  MATRIX_L1: 'Admin_Node',
  MATRIX_L2: 'System_Link',
  MATRIX_L3: 'Global_Alpha',
  MATRIX_L4: 'DeFi_Master',
  MATRIX_L5: 'Prime_Core',
  MATRIX_L6: 'Support_Level',

  // Wallet addresses for each default matrix slot
  WALLET_L1: 'AdmNKXxqZw9yZqWMVHshV2GdNGhBBm3qZBJNm4pVcwuX',
  WALLET_L2: 'SysLk3nXzBQxqWMVHshV2GdNGhBBm3qZBJNm4pVcwuX',
  WALLET_L3: 'GbALPhv2qZBJNm4pVcwuXAdmNKXxqZw9yZqWMVHshV2',
  WALLET_L4: 'DFMstr8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWMNKXx',
  WALLET_L5: 'PrmCrWMVHshV2GdNGhBBm3qZBJNm4pVcwuXAdmNKXxq',
  WALLET_L6: 'SptLvLVL9zYtAWWMNKXxqZw9yZqWMVHshV2GdNGhBBm3',
};

// ── Resolve values: env takes priority over defaults ────────
function resolve(key) {
  const val = process.env[key];
  if (val !== undefined && val !== '') return val;
  if (DEFAULTS[key] !== undefined) return DEFAULTS[key];
  console.warn(`[build] WARNING: no value for {{${key}}} — leaving blank`);
  return '';
}

// ── Read template ───────────────────────────────────────────
const src = path.join(__dirname, 'index.html');
if (!fs.existsSync(src)) {
  console.error('[build] ERROR: index.html not found');
  process.exit(1);
}
let html = fs.readFileSync(src, 'utf8');

// ── Replace all {{PLACEHOLDER}} tokens ──────────────────────
const TOKEN_RE = /\{\{([A-Z0-9_]+)\}\}/g;
const replaced = new Set();

html = html.replace(TOKEN_RE, (_, key) => {
  replaced.add(key);
  return resolve(key);
});

// ── Report ──────────────────────────────────────────────────
console.log(`[build] Replaced ${replaced.size} token(s): ${[...replaced].join(', ')}`);

// ── Write output ─────────────────────────────────────────────
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

const out = path.join(distDir, 'index.html');
fs.writeFileSync(out, html, 'utf8');
console.log(`[build] Output written → dist/index.html (${(html.length / 1024).toFixed(1)} KB)`);
