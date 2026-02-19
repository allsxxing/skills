// database.js — SQLite knowledge base (better-sqlite3)
// Synchronous operations — no async DB calls per MCP best practices.

import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = join(__dirname, 'db', 'xai_careers.sqlite');

let db = null;

/**
 * Initialize the database — create tables if they don't exist and return the db instance.
 * @param {string} [dbPath] — override database file path
 * @returns {Database.Database}
 */
export function initDB(dbPath) {
  if (db) return db;

  const resolvedPath = dbPath || process.env.XAI_DB_PATH || DEFAULT_DB_PATH;
  mkdirSync(dirname(resolvedPath), { recursive: true });

  db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create roles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      department TEXT,
      location TEXT,
      employment_type TEXT,
      description TEXT,
      requirements TEXT,
      nice_to_have TEXT,
      posted_date TEXT,
      role_url TEXT,
      scraped_at TEXT,
      is_new INTEGER DEFAULT 1,
      is_updated INTEGER DEFAULT 0,
      first_seen TEXT,
      last_seen TEXT
    )
  `);

  // Create scrape_log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scrape_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_at TEXT,
      roles_total INTEGER,
      roles_new INTEGER,
      roles_updated INTEGER,
      roles_removed INTEGER,
      status TEXT
    )
  `);

  // Indexes for common queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_roles_department ON roles(department);
    CREATE INDEX IF NOT EXISTS idx_roles_employment_type ON roles(employment_type);
    CREATE INDEX IF NOT EXISTS idx_roles_is_new ON roles(is_new);
    CREATE INDEX IF NOT EXISTS idx_roles_is_updated ON roles(is_updated);
    CREATE INDEX IF NOT EXISTS idx_roles_last_seen ON roles(last_seen);
    CREATE INDEX IF NOT EXISTS idx_roles_first_seen ON roles(first_seen);
  `);

  console.error('[database] Initialized:', resolvedPath);
  return db;
}

/**
 * Get the active database instance (must call initDB first).
 */
export function getDB() {
  if (!db) throw new Error('Database not initialized. Call initDB() first.');
  return db;
}

/**
 * Insert or update a role with change detection.
 * Sets is_new=1 on first insert, is_updated=1 if description/requirements changed.
 * @param {Object} role
 * @returns {{ action: 'inserted'|'updated'|'unchanged', id: string }}
 */
export function upsertRole(role) {
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT id, description, requirements FROM roles WHERE id = ?').get(role.id);

  if (!existing) {
    // New role — insert
    db.prepare(`
      INSERT INTO roles (id, title, department, location, employment_type, description,
        requirements, nice_to_have, posted_date, role_url, scraped_at,
        is_new, is_updated, first_seen, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)
    `).run(
      role.id, role.title, role.department || null,
      typeof role.location === 'string' ? role.location : JSON.stringify(role.location || []),
      role.employment_type || null,
      role.description || null,
      typeof role.requirements === 'string' ? role.requirements : JSON.stringify(role.requirements || []),
      typeof role.nice_to_have === 'string' ? role.nice_to_have : JSON.stringify(role.nice_to_have || []),
      role.posted_date || null,
      role.role_url || null,
      now, now, now
    );
    return { action: 'inserted', id: role.id };
  }

  // Existing role — check for changes
  const newDesc = role.description || null;
  const newReqs = typeof role.requirements === 'string'
    ? role.requirements
    : JSON.stringify(role.requirements || []);
  const changed = existing.description !== newDesc || existing.requirements !== newReqs;

  db.prepare(`
    UPDATE roles SET
      title = ?, department = ?, location = ?, employment_type = ?,
      description = ?, requirements = ?, nice_to_have = ?,
      posted_date = ?, role_url = ?, scraped_at = ?,
      is_new = 0, is_updated = ?, last_seen = ?
    WHERE id = ?
  `).run(
    role.title, role.department || null,
    typeof role.location === 'string' ? role.location : JSON.stringify(role.location || []),
    role.employment_type || null,
    newDesc, newReqs,
    typeof role.nice_to_have === 'string' ? role.nice_to_have : JSON.stringify(role.nice_to_have || []),
    role.posted_date || null,
    role.role_url || null,
    now,
    changed ? 1 : 0,
    now,
    role.id
  );

  return { action: changed ? 'updated' : 'unchanged', id: role.id };
}

/**
 * Fetch a single role by ID.
 * @param {string} id
 * @returns {Object|null}
 */
export function getRoleById(id) {
  return db.prepare('SELECT * FROM roles WHERE id = ?').get(id) || null;
}

/**
 * Return all roles in the database.
 * @returns {Array<Object>}
 */
export function getAllRoles() {
  return db.prepare('SELECT * FROM roles ORDER BY last_seen DESC').all();
}

/**
 * Full-text search + optional department/type filter.
 * @param {string} query — keyword to match against title, description, requirements
 * @param {Object} [filters]
 * @param {string} [filters.department]
 * @param {string} [filters.employment_type]
 * @param {number} [filters.limit=10]
 * @returns {Array<Object>}
 */
export function searchRoles(query, filters = {}) {
  const conditions = [];
  const params = [];

  if (query) {
    conditions.push('(title LIKE ? OR description LIKE ? OR requirements LIKE ? OR department LIKE ?)');
    const pattern = `%${query}%`;
    params.push(pattern, pattern, pattern, pattern);
  }

  if (filters.department) {
    conditions.push('department LIKE ?');
    params.push(`%${filters.department}%`);
  }

  if (filters.employment_type) {
    conditions.push('employment_type LIKE ?');
    params.push(`%${filters.employment_type}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Math.min(filters.limit || 10, 100);
  params.push(limit);

  return db.prepare(`SELECT * FROM roles ${where} ORDER BY last_seen DESC LIMIT ?`).all(...params);
}

/**
 * Get roles where last_seen >= now - N days.
 * @param {number} [days=7]
 * @returns {Array<Object>}
 */
export function getRecentRoles(days = 7) {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  return db.prepare(
    'SELECT * FROM roles WHERE last_seen >= ? ORDER BY first_seen DESC'
  ).all(cutoff);
}

/**
 * Filter roles by department.
 * @param {string} department
 * @returns {Array<Object>}
 */
export function getRolesByDept(department) {
  return db.prepare(
    'SELECT * FROM roles WHERE department LIKE ? ORDER BY last_seen DESC'
  ).all(`%${department}%`);
}

/**
 * Write a row to the scrape_log table.
 * @param {Object} stats
 */
export function logScrapeRun(stats) {
  db.prepare(`
    INSERT INTO scrape_log (run_at, roles_total, roles_new, roles_updated, roles_removed, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    stats.run_at || new Date().toISOString(),
    stats.roles_total || 0,
    stats.roles_new || 0,
    stats.roles_updated || 0,
    stats.roles_removed || 0,
    stats.status || 'unknown'
  );
}

/**
 * Return the most recent scrape_log row.
 * @returns {Object|null}
 */
export function getLastScrapeLog() {
  return db.prepare('SELECT * FROM scrape_log ORDER BY id DESC LIMIT 1').get() || null;
}

/**
 * Return last N scrape_log rows.
 * @param {number} [limit=10]
 * @returns {Array<Object>}
 */
export function getScrapeLogs(limit = 10) {
  return db.prepare('SELECT * FROM scrape_log ORDER BY id DESC LIMIT ?').all(limit);
}

/**
 * Get the count of roles in the database.
 * @returns {number}
 */
export function getRoleCount() {
  return db.prepare('SELECT COUNT(*) as count FROM roles').get().count;
}

/**
 * Reset is_new and is_updated flags for all roles before a scrape run.
 */
export function resetFlags() {
  db.prepare('UPDATE roles SET is_new = 0, is_updated = 0').run();
}

/**
 * Close the database connection.
 */
export function closeDB() {
  if (db) {
    db.close();
    db = null;
    console.error('[database] Connection closed');
  }
}
