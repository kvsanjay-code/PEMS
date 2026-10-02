import fs from 'node:fs';
import path from 'node:path';

/** Default user list: one login per line. Kept out of git; override with USERS_FILE. */
const DEFAULT_USERS_FILE = path.join(__dirname, 'users.txt');

/** CSV header names (case-insensitive) recognised as the login column; otherwise the first column is used. */
const LOGIN_COLUMNS = ['username', 'user', 'login', 'email', 'client id', 'clientid', 'user id', 'userid'];

/**
 * Reads the logins for the bulk run from a .txt (one per line) or .csv (with a header row) file.
 * Blank lines and lines starting with # are ignored, and duplicates are dropped because each login
 * becomes a test title. BULK_LIMIT=N keeps only the first N, for a trial run.
 */
export function loadUsers(): string[] {
  const file = process.env.USERS_FILE ? path.resolve(process.env.USERS_FILE) : DEFAULT_USERS_FILE;
  if (!fs.existsSync(file)) {
    throw new Error(`User list not found: ${file}. Create it with one login per line, or set USERS_FILE.`);
  }

  const lines = fs
    .readFileSync(file, 'utf8')
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));

  let logins = lines;
  if (path.extname(file).toLowerCase() === '.csv') {
    const cells = (line: string) => line.split(',').map(cell => cell.trim().replace(/^"(.*)"$/, '$1').trim());
    const header = cells(lines[0] ?? '').map(name => name.toLowerCase());
    const column = Math.max(0, header.findIndex(name => LOGIN_COLUMNS.includes(name)));
    logins = lines.slice(1).map(line => cells(line)[column] ?? '').filter(Boolean);
  }

  const users = [...new Set(logins)];
  const limit = Number(process.env.BULK_LIMIT ?? 0);
  const selected = limit > 0 ? users.slice(0, limit) : users;
  if (!selected.length) {
    throw new Error(`User list is empty: ${file}`);
  }
  return selected;
}
