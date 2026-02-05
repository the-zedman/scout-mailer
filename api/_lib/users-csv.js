const fs = require('fs');
const path = require('path');
const { list, put } = require('@vercel/blob');

const POINTER_PATH = 'users-current.txt';
const SEED_PATH = path.join(process.cwd(), 'data', 'users.seed.csv');

const CSV_HEADER = 'FirstName,LastName,Email,PasswordHash,Role';

function parseCsv(csv) {
  const lines = String(csv || '').trim().split(/\r?\n/).filter(Boolean);
  return lines.map((line) => line.split(','));
}

function serializeCsv(rows) {
  return rows.map((row) => row.join(',')).join('\n') + '\n';
}

/**
 * Read current CSV: pointer file tells us which blob has the CSV. Fetch that blob. No overwriting.
 */
async function getUsersCsv() {
  try {
    const { blobs: pointerBlobs } = await list({ prefix: POINTER_PATH });
    const pointerBlob = (pointerBlobs || []).find((b) => b.pathname === POINTER_PATH);
    if (pointerBlob?.url) {
      const res = await fetch(pointerBlob.url, { cache: 'no-store' });
      if (res.ok) {
        const pathname = (await res.text()).trim();
        if (pathname) {
          const { blobs } = await list({ prefix: pathname });
          const csvBlob = (blobs || []).find((b) => b.pathname === pathname);
          if (csvBlob?.url) {
            const csvRes = await fetch(csvBlob.url, { cache: 'no-store' });
            if (csvRes.ok) return await csvRes.text();
          }
        }
      }
    }
  } catch (_) {}
  if (fs.existsSync(SEED_PATH)) {
    const seed = fs.readFileSync(SEED_PATH, 'utf8');
    try { await bootstrapSeedToBlob(); } catch (_) {}
    return seed;
  }
  return CSV_HEADER + '\n';
}

/**
 * Write CSV: new blob each time (new URL = no cache), then update pointer so next read gets it.
 */
async function setUsersCsv(csv) {
  const pathname = 'users-' + Date.now() + '.csv';
  await put(pathname, csv, { contentType: 'text/csv', access: 'public' });
  await put(POINTER_PATH, pathname, { contentType: 'text/plain', access: 'public' });
}

/**
 * Bootstrap: first time we have no pointer. Write seed to a blob and set pointer. Called once from getUsersCsv when no pointer.
 */
async function bootstrapSeedToBlob() {
  if (!fs.existsSync(SEED_PATH)) return;
  const seed = fs.readFileSync(SEED_PATH, 'utf8');
  const pathname = 'users-' + Date.now() + '.csv';
  await put(pathname, seed, { contentType: 'text/csv', access: 'public' });
  await put(POINTER_PATH, pathname, { contentType: 'text/plain', access: 'public' });
}

function findUserByEmail(rows, email) {
  const normalized = String(email || '').trim().toLowerCase();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][2] && rows[i][2].toLowerCase() === normalized) return { row: rows[i], index: i };
  }
  return null;
}

function appendUser(rows, firstName, lastName, email, passwordHash, role = 'Author') {
  const newRow = [firstName, lastName, String(email).trim(), passwordHash, role];
  return serializeCsv([...rows, newRow]);
}

function updateUserRow(rows, targetEmail, updates) {
  const normalized = String(targetEmail).trim().toLowerCase();
  const out = rows.map((row, i) => {
    if (i === 0) return row;
    if (!Array.isArray(row) || !row[2] || row[2].toLowerCase() !== normalized) return row;
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
  const normalized = String(targetEmail).trim().toLowerCase();
  const out = rows.filter((row, i) => i === 0 || !row[2] || row[2].toLowerCase() !== normalized);
  return serializeCsv(out);
}

module.exports = {
  CSV_HEADER,
  parseCsv,
  serializeCsv,
  getUsersCsv,
  setUsersCsv,
  bootstrapSeedToBlob,
  findUserByEmail,
  appendUser,
  updateUserRow,
  deleteUserRow,
};
