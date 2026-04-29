const Database = require("better-sqlite3");
const db = new Database("data/bookmarks.db");

function cleanContent(content) {
  let cleaned = content;
  cleaned = cleaned.replace(/\s*Title:[\s\S]*?(?=URL Source:|Published Time:|Markdown Content:|$)/i, "");
  cleaned = cleaned.replace(/\s*URL Source:[\s\S]*?(?=Published Time:|Markdown Content:|$)/i, "");
  cleaned = cleaned.replace(/\s*Published Time:[\s\S]*?(?=Markdown Content:|$)/i, "");
  cleaned = cleaned.replace(/\s*Markdown Content:\s*/i, "");
  cleaned = cleaned.replace(/^#+\s*Article\s*/i, "");
  cleaned = cleaned.replace(/^#+\s*Conversation\s*/i, "");
  cleaned = cleaned.replace(/##\s*Article\s*/gi, "");
  cleaned = cleaned.replace(/##\s*Conversation\s*/gi, "");
  return cleaned.replace(/\n{3,}/g, "\n\n").trim();
}

const rows = db.prepare("SELECT url, content FROM bookmarks LIMIT 1").all();
if (!rows.length) { console.log("No bookmarks."); process.exit(0); }

const raw = rows[0].content;
const cleaned = cleanContent(raw);

console.log("=== RAW 前200字 ===");
console.log(JSON.stringify(raw.slice(0, 200)));
console.log("\n=== CLEANED 前600字 (传给 ReactMarkdown 的内容) ===");
console.log(JSON.stringify(cleaned.slice(0, 600)));
console.log("\n=== CLEANED 可读形式 ===");
console.log(cleaned.slice(0, 600));

db.close();
