const bcrypt = require('bcryptjs');
const {
  getUsersCsv,
  parseCsv,
  findUserByEmail,
} = require('./_lib/users-csv.js');
const { createToken, addToken } = require('./_lib/tokens.js');

const ROLES = ['Admin', 'Manager', 'Author'];

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', [
    'session=' + token + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400',
  ]);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { email, password } = body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const csv = await getUsersCsv();
    const rows = parseCsv(csv);
    const user = findUserByEmail(rows, email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const [, , , hash, role] = user.row;
    const match = bcrypt.compareSync(password, hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const roleVal = ROLES.includes(role) ? role : 'Author';
    const token = createToken();
    await addToken(token, email.trim().toLowerCase(), roleVal);
    setSessionCookie(res, token);

    const [firstName, lastName] = user.row;
    return res.status(200).json({
      success: true,
      user: {
        firstName,
        lastName,
        email: user.row[2],
        role: roleVal,
      },
    });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
};
