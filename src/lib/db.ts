import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// 数据库文件存放在项目根目录的 data/ 文件夹中
const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "bookmarks.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  // 确保 data/ 目录存在
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  _db = new Database(DB_PATH);

  // 开启 WAL 模式，提升并发读取性能
  _db.pragma("journal_mode = WAL");

  // 自动建表
  _db.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id         TEXT PRIMARY KEY,
      url        TEXT NOT NULL UNIQUE,
      content    TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return _db;
}
