const Database = require("better-sqlite3");
const db = new Database("data/bookmarks.db");

const rows = db.prepare("SELECT url, content FROM bookmarks LIMIT 1").all();
if (!rows.length) { console.log("No bookmarks."); process.exit(0); }

const content = rows[0].content;
const lines = content.split("\n");
const mdLines = lines.filter(l =>
  l.startsWith("#") || l.includes("**") || l.includes("__") || l.startsWith(">") || l.startsWith("-")
);

console.log("总行数:", lines.length);
console.log("含 Markdown 格式的行数:", mdLines.length);
console.log("\n=== 含 Markdown 格式的行 ===");
mdLines.slice(0, 20).forEach((l, i) => console.log(`${i+1}: ${l.slice(0,100)}`));
db.close();
