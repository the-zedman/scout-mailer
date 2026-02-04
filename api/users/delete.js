const { getSession } = require('../_lib/tokens.js');
const {
  getUsersCsv,
  setUsersCsv,
  parseCsv,
  findUserByEmail,
  deleteUserRow,
} = require('../_lib/users-csv.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession(req);
    if (!session || session.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { targetEmail } = body || {};
    if (!targetEmail?.trim()) {
      return res.status(400).json({ error: 'targetEmail is required' });
    }

    const csv = await getUsersCsv();
    const rows = parseCsv(csv);
    const target = findUserByEmail(rows, targetEmail);
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newCsv = deleteUserRow(rows, targetEmail);
    await setUsersCsv(newCsv);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('User delete error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
};
