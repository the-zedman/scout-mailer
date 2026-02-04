const { getSession } = require('../_lib/tokens.js');
const { getUsersCsv, parseCsv } = require('../_lib/users-csv.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession(req);
    if (!session || session.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const csv = await getUsersCsv();
    const rows = parseCsv(csv);
    const users = [];
    for (let i = 1; i < rows.length; i++) {
      const [firstName, lastName, email, , role] = rows[i];
      users.push({ firstName, lastName, email, role: role || 'Author' });
    }
    return res.status(200).json({ users });
  } catch (e) {
    console.error('Users list error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
};
