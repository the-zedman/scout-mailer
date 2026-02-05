/**
 * Safely get parsed JSON body from Vercel Node.js request.
 * Handles string, Buffer, or pre-parsed object. Returns null for invalid/missing body.
 */
function getJsonBody(req) {
  const raw = req.body;
  if (raw === undefined || raw === null) return null;
  if (typeof raw === 'object' && !Buffer.isBuffer(raw) && raw !== null) {
    return raw;
  }
  if (Buffer.isBuffer(raw)) {
    try {
      return JSON.parse(raw.toString('utf8'));
    } catch (_) {
      return null;
    }
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }
  return null;
}

module.exports = { getJsonBody };
