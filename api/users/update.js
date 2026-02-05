const { getSession } = require('../_lib/tokens.js');
const { getJsonBody } = require('../_lib/body.js');
const {
  getUsersCsv,
  setUsersCsv,
  parseCsv,
  findUserByEmail,
  updateUserRow,
} = require('../_lib/users-csv.js');

const ROLES = ['Admin', 'Manager', 'Author'];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = getSession(req);
    if (!session || session.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const body = getJsonBody(req);
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid or missing JSON body' });
    }
    const { targetEmail, firstName, lastName, email, role } = body;
    if (!targetEmail || !String(targetEmail).trim()) {
      return res.status(400).json({ error: 'targetEmail is required' });
    }

    const csv = await getUsersCsv();
    const rows = parseCsv(csv);
    const target = findUserByEmail(rows, targetEmail);
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};
    if (firstName !== undefined) updates.firstName = String(firstName).trim();
    if (lastName !== undefined) updates.lastName = String(lastName).trim();
    if (email !== undefined) updates.email = String(email).trim();
    if (role !== undefined) updates.role = ROLES.includes(role) ? role : 'Author';

    const newCsv = updateUserRow(rows, targetEmail, updates);
    await setUsersCsv(newCsv);
    const newRows = parseCsv(newCsv);
    const users = [];
    for (let i = 1; i < newRows.length; i++) {
      const [firstName, lastName, email, , role] = newRows[i];
      users.push({ firstName, lastName, email, role: role || 'Author' });
    }
    return res.status(200).json({ success: true, users });
  } catch (e) {
    console.error('User update error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
};
