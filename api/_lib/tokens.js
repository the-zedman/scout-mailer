const crypto = require('crypto');
const { list, put, del } = require('@vercel/blob');

const TOKENS_BLOB_PATH = 'session-tokens.json';
const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

function createToken() {
  return crypto.randomBytes(16).toString('hex');
}

async function getTokensJson() {
  try {
    const { blobs } = await list({ prefix: TOKENS_BLOB_PATH });
    const blob = blobs.find((b) => b.pathname === TOKENS_BLOB_PATH);
    if (blob?.url) {
      const res = await fetch(blob.url);
      if (res.ok) {
        const text = await res.text();
        return text ? JSON.parse(text) : {};
      }
    }
  } catch (_) {}
  return {};
}

async function setTokensJson(data) {
  await put(TOKENS_BLOB_PATH, JSON.stringify(data), {
    contentType: 'application/json',
  });
}

async function addToken(token, email, role) {
  const data = await getTokensJson();
  data[token] = {
    email,
    role,
    exp: Date.now() + TOKEN_MAX_AGE_MS,
  };
  await setTokensJson(data);
}

async function getTokenData(token) {
  if (!token) return null;
  const data = await getTokensJson();
  const entry = data[token];
  if (!entry || entry.exp < Date.now()) {
    if (entry) delete data[token]; await setTokensJson(data);
    return null;
  }
  return { email: entry.email, role: entry.role };
}

async function deleteToken(token) {
  const data = await getTokensJson();
  delete data[token];
  await setTokensJson(data);
}

function getTokenFromCookie(req) {
  const cookie = req.headers?.cookie || '';
  const match = cookie.match(/\bsession=([^;\s]+)/);
  return match ? match[1].trim() : null;
}

async function getSession(req) {
  const token = getTokenFromCookie(req);
  return token ? getTokenData(token) : null;
}

module.exports = {
  createToken,
  addToken,
  getTokenData,
  deleteToken,
  getTokenFromCookie,
  getSession,
};
