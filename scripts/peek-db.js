const Database = require("better-sqlite3");
const db = new Database("data/bookmarks.db");
const rows = db.prepare("SELECT id, url, substr(content, 1, 800) as preview FROM bookmarks").all();
if (rows.length === 0) {
  console.log("数据库里没有书签，请先保存一条。");
} else {
  rows.forEach((row, i) => {
    console.log(`\n=== 书签 ${i + 1} ===`);
    console.log("URL:", row.url);
    console.log("内容前800字符:");
    console.log(JSON.stringify(row.preview));
  });
}
db.close();
