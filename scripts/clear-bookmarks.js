const Database = require("better-sqlite3");
const db = new Database("data/bookmarks.db");
const result = db.prepare("DELETE FROM bookmarks").run();
console.log("Deleted", result.changes, "old bookmarks.");
db.close();
