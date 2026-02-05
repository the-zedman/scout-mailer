const fs = require('fs');
const path = require('path');
const { Redis } = require('@upstash/redis');

const KEY = 'users-csv';
const SEED_PATH = path.join(process.cwd(), 'data', 'users.seed.csv');
const CSV_HEADER = 'FirstName,LastName,Email,PasswordHash,Role';

function parseCsv(csv) {
  const lines = String(csv || '').trim().split(/\r?\n/).filter(Boolean);
  return lines.map((line) => line.split(','));
}

function serializeCsv(rows) {
  return rows.map((row) => row.join(',')).join('\n') + '\n';
}

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

async function getUsersCsv() {
  const redis = getRedis();
  if (redis) {
    try {
      const csv = await redis.get(KEY);
      if (csv && typeof csv === 'string') return csv;
      if (fs.existsSync(SEED_PATH)) {
        const seed = fs.readFileSync(SEED_PATH, 'utf8');
        await redis.set(KEY, seed);
        return seed;
      }
    } catch (_) {}
  }
  if (fs.existsSync(SEED_PATH)) return fs.readFileSync(SEED_PATH, 'utf8');
  return CSV_HEADER + '\n';
}

async function setUsersCsv(csv) {
  const redis = getRedis();
  if (!redis) throw new Error('Upstash Redis not configured. Add the Upstash Redis integration in Vercel.');
  await redis.set(KEY, csv);
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
