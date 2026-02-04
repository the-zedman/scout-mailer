const crypto = require('crypto');

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production';
const IS_PRODUCTION = !!process.env.VERCEL;

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

function getCookieValue(req) {
  if (req.cookies && typeof req.cookies.session === 'string') return req.cookies.session;
  const cookie = req.headers?.cookie || req.headers?.Cookie || '';
  const match = cookie.match(/\bsession=([^;\s]+)/);
  return match ? match[1].trim() : null;
}

function decodeBase64url(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf8');
}

function getSession(req) {
  const raw = getCookieValue(req);
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot === -1) return null;
  const value = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (sign(value) !== sig) return null;
  try {
    const payload = JSON.parse(decodeBase64url(value));
    if (payload.exp && payload.exp < Date.now()) return null;
    return { email: payload.email, role: payload.role };
  } catch (_) {
    return null;
  }
}

function clearSessionCookie(res) {
  const opts = 'Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
  res.setHeader('Set-Cookie', ['session=; ' + opts + (IS_PRODUCTION ? '; Secure' : '')]);
}

function setSessionCookie(res, email, role) {
  const cookie = createSessionCookie(email, role);
  const opts = 'Path=/; HttpOnly; SameSite=Lax; Max-Age=86400' + (IS_PRODUCTION ? '; Secure' : '');
  res.setHeader('Set-Cookie', ['session=' + cookie + '; ' + opts]);
}

module.exports = {
  getSession,
  setSessionCookie,
  clearSessionCookie,
};
