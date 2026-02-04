const bcrypt = require('bcryptjs');
const {
  getUsersCsv,
  setUsersCsv,
  parseCsv,
  findUserByEmail,
  appendUser,
} = require('./_lib/users-csv.js');

const ROLES = ['Admin', 'Manager', 'Author'];
const DEFAULT_ROLE = 'Author';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { firstName, lastName, email, password } = body || {};
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'First name, last name, email, and password are required' });
    }
    if ([firstName, lastName, email].some((s) => String(s).includes(','))) {
      return res.status(400).json({ error: 'First name, last name, and email cannot contain commas' });
    }

    const csv = await getUsersCsv();
    const rows = parseCsv(csv);
    if (findUserByEmail(rows, email)) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const hashed = bcrypt.hashSync(password, 10);
    const newCsv = appendUser(rows, firstName.trim(), lastName.trim(), email.trim(), hashed, DEFAULT_ROLE);
    await setUsersCsv(newCsv);

    return res.status(201).json({
      success: true,
      user: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role: DEFAULT_ROLE,
      },
    });
  } catch (e) {
    console.error('Register error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
};
