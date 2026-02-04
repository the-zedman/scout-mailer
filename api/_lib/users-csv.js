const fs = require('fs');
const path = require('path');
const { list, put } = require('@vercel/blob');

const BLOB_PATH = 'users.csv';
const SEED_PATH = path.join(process.cwd(), 'data', 'users.seed.csv');

const CSV_HEADER = 'FirstName,LastName,Email,PasswordHash,Role';

/**
 * Parse CSV string into rows (array of arrays). First row is header.
 * Does not handle quoted commas; safe for our fields (no commas in input).
 */
function parseCsv(csv) {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  return lines.map((line) => line.split(','));
}

/**
 * Serialize rows back to CSV string.
 */
function serializeCsv(rows) {
  return rows.map((row) => row.join(',')).join('\n') + '\n';
}

/**
 * Get full CSV content: from Blob if present, else from seed file and optionally bootstrap Blob.
 */
async function getUsersCsv() {
  try {
    const { blobs } = await list({ prefix: BLOB_PATH });
    const usersBlob = blobs.find((b) => b.pathname === BLOB_PATH);
    if (usersBlob?.url) {
      const res = await fetch(usersBlob.url);
      if (res.ok) return await res.text();
    }
  } catch (_) {
    // Blob not configured or error – use seed
  }
  // Fallback: read seed file from repo
  if (fs.existsSync(SEED_PATH)) {
    const seed = fs.readFileSync(SEED_PATH, 'utf8');
    try {
      await put(BLOB_PATH, seed, { contentType: 'text/csv' });
    } catch (_) {}
    return seed;
  }
  return CSV_HEADER + '\n';
}

/**
 * Write full CSV content to Blob.
 */
async function setUsersCsv(csv) {
  await put(BLOB_PATH, csv, { contentType: 'text/csv' });
}

/**
 * Find user row by email. Rows are [FirstName, LastName, Email, PasswordHash, Role].
 */
function findUserByEmail(rows, email) {
  const normalized = email.trim().toLowerCase();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][2]?.toLowerCase() === normalized) return { row: rows[i], index: i };
  }
  return null;
}

/**
 * Append a new user row and return updated CSV string.
 */
function appendUser(rows, firstName, lastName, email, passwordHash, role = 'Author') {
  const newRow = [firstName, lastName, email.trim(), passwordHash, role];
  const newRows = [...rows, newRow];
  return serializeCsv(newRows);
}

module.exports = {
  CSV_HEADER,
  parseCsv,
  serializeCsv,
  getUsersCsv,
  setUsersCsv,
  findUserByEmail,
  appendUser,
};
