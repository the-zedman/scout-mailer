const fs = require('fs');
const path = require('path');

const GITHUB_API = 'https://api.github.com/repos/the-zedman/scout-mailer/contents/data/users.csv';
const SEED_PATH = path.join(process.cwd(), 'data', 'users.seed.csv');
const CSV_HEADER = 'FirstName,LastName,Email,PasswordHash,Role';

function parseCsv(csv) {
  const lines = String(csv || '').trim().split(/\r?\n/).filter(Boolean);
  return lines.map((line) => line.split(','));
}

function serializeCsv(rows) {
  return rows.map((row) => row.join(',')).join('\n') + '\n';
}

async function getUsersCsv() {
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    try {
      const res = await fetch(GITHUB_API, {
        headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github.raw' },
      });
      if (res.ok) return await res.text();
    } catch (_) {}
  }
  if (fs.existsSync(SEED_PATH)) return fs.readFileSync(SEED_PATH, 'utf8');
  return CSV_HEADER + '\n';
}

async function setUsersCsv(csv) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not set');

  let sha = null;
  const getRes = await fetch(GITHUB_API, {
    headers: { Authorization: 'Bearer ' + token },
  });
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }

  const body = {
    message: 'Update users.csv',
    content: Buffer.from(csv, 'utf8').toString('base64'),
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(GITHUB_API, {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!putRes.ok) {
    const err = await putRes.text();
    throw new Error('GitHub API: ' + putRes.status + ' ' + err);
  }
}

function findUserByEmail(rows, email) {
  const n = String(email || '').trim().toLowerCase();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][2] && rows[i][2].toLowerCase() === n) return { row: rows[i], index: i };
  }
  return null;
}

function appendUser(rows, firstName, lastName, email, passwordHash, role) {
  const newRow = [firstName, lastName, String(email).trim(), passwordHash, role || 'Author'];
  return serializeCsv([...rows, newRow]);
}

function updateUserRow(rows, targetEmail, updates) {
  const n = String(targetEmail).trim().toLowerCase();
  const out = rows.map((row, i) => {
    if (i === 0) return row;
    if (!Array.isArray(row) || !row[2] || row[2].toLowerCase() !== n) return row;
    return [
      updates.firstName !== undefined ? String(updates.firstName).trim() : (row[0] || ''),
      updates.lastName !== undefined ? String(updates.lastName).trim() : (row[1] || ''),
      updates.email !== undefined ? String(updates.email).trim() : (row[2] || ''),
      row[3] != null ? String(row[3]) : '',
      updates.role !== undefined ? updates.role : (row[4] || 'Author'),
    ];
  });
  return serializeCsv(out);
}

function deleteUserRow(rows, targetEmail) {
  const n = String(targetEmail).trim().toLowerCase();
  const out = rows.filter((row, i) => i === 0 || !row[2] || row[2].toLowerCase() !== n);
  return serializeCsv(out);
}

module.exports = {
  CSV_HEADER,
  parseCsv,
  serializeCsv,
  getUsersCsv,
  setUsersCsv,
  findUserByEmail,
  appendUser,
  updateUserRow,
  deleteUserRow,
};
