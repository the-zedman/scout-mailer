const { getTokenFromCookie, deleteToken } = require('./_lib/tokens.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = getTokenFromCookie(req);
    if (token) await deleteToken(token);
    res.setHeader('Set-Cookie', [
      'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    ]);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('Logout error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
};
