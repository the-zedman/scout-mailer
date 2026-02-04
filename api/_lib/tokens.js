const crypto = require('crypto');

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production';

function sign(value) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
}

function createSessionCookie(email, role) {
  const payload = {
    email: email.trim().toLowerCase(),
    role: role || 'Author',
    exp: Date.now() + SESSION_MAX_AGE_MS,
  };
  const value = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = sign(value);
  return value + '.' + sig;
}

function getSession(req) {
  const cookie = req.headers?.cookie || req.headers?.Cookie || '';
  const match = cookie.match(/\bsession=([^;\s]+)/);
  const raw = match ? match[1].trim() : null;
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot === -1) return null;
  const value = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (sign(value) !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Date.now()) return null;
    return { email: payload.email, role: payload.role };
  } catch (_) {
    return null;
  }
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', [
    'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
  ]);
}

function setSessionCookie(res, email, role) {
  const cookie = createSessionCookie(email, role);
  res.setHeader('Set-Cookie', [
    'session=' + cookie + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400',
  ]);
}

module.exports = {
  getSession,
  setSessionCookie,
  clearSessionCookie,
};
