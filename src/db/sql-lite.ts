// --- SQLite setup ---
import Database from "better-sqlite3";
import path from "path";
import {app} from "electron";

let sqlLite: Database.Database;

export function initDatabase() {
    const dbPath = path.join(app.getPath('userData'), 'clipboard.sqlLite');
    sqlLite = new Database(dbPath);
    sqlLite.pragma('journal_mode = WAL');
    sqlLite.exec(`
        CREATE TABLE IF NOT EXISTS clipboard_items
        (
            id
            INTEGER
            PRIMARY
            KEY
            AUTOINCREMENT,
            content
            TEXT
            NOT
            NULL,
            type
            TEXT
            NOT
            NULL
            DEFAULT
            'text',
            created_at
            INTEGER
            NOT
            NULL
        );
        CREATE INDEX IF NOT EXISTS idx_clipboard_created_at ON clipboard_items(created_at DESC);
    `);
}

// Insert item (avoid immediate duplicates — optional)
export const insertStmt = () =>
    sqlLite.prepare(`
        INSERT INTO clipboard_items (content, type, created_at)
        VALUES (?, ?, ?)
    `);

export const recentSameStmt = () =>
    sqlLite.prepare(`
        SELECT id
        FROM clipboard_items
        WHERE content = ?
          AND type = ?
        ORDER BY id DESC LIMIT 1
    `);

export const listStmt = () =>
    sqlLite.prepare(`
        SELECT id, content, type, created_at
        FROM clipboard_items
        WHERE (? IS NULL OR content LIKE '%' || ? || '%')
        ORDER BY created_at DESC LIMIT ?
    `);

export const clearStmt = () => sqlLite.prepare(`DELETE
                                                FROM clipboard_items`);