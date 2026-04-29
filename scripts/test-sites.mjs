/**
 * 批量测试各网站的 Jina Reader 抓取成功率
 * 运行：node scripts/test-sites.mjs
 */

const TIMEOUT_MS = 15_000;
const TEST_URLS = [
  // 技术/博客
  { name: "少数派",       url: "https://sspai.com/post/85889" },
  { name: "掘金",         url: "https://juejin.cn/post/7350212574712348682" },
  { name: "知乎专栏",     url: "https://zhuanlan.zhihu.com/p/680667197" },
  { name: "V2EX",         url: "https://www.v2ex.com/t/1017820" },
  { name: "36氪",         url: "https://36kr.com/p/2707070561494791" },
  { name: "虎嗅",         url: "https://www.huxiu.com/article/3024567.html" },
  { name: "Medium",       url: "https://medium.com/towards-data-science/yes-you-can-fine-tune-llama-3-in-your-laptop-6b1c9d69b4c8" },
  { name: "Hacker News",  url: "https://news.ycombinator.com/item?id=39898124" },
  { name: "MDN",          url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise" },
  { name: "Next.js Docs", url: "https://nextjs.org/docs/app/building-your-application/routing" },
  // 社交
  { name: "X 长文",       url: "https://x.com/Khazix0918/article/2048614713605734594" },
  { name: "微信公众号",   url: "https://mp.weixin.qq.com/s/sPhgGQjDU_7JhqeSZXV_8A" },
  // 视频/电商（通常抓不到正文）
  { name: "B站",          url: "https://www.bilibili.com/video/BV1GJ411x7h7" },
  { name: "YouTube",      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
];

async function testUrl({ name, url }) {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();

  try {
    const res = await fetch(jinaUrl, {
      headers: { Accept: "text/plain,text/markdown" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    if (!res.ok) {
      return { name, status: "❌ HTTP " + res.status, elapsed, chars: 0 };
    }

    const text = await res.text();
    const chars = text.trim().length;

    if (chars < 100) {
      return { name, status: "⚠️  内容太短", elapsed, chars };
    }
    return { name, status: "✅ 成功", elapsed, chars };
  } catch (e) {
    clearTimeout(timer);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const msg = e.name === "AbortError" ? "⏱️  超时" : "❌ " + e.message.slice(0, 40);
    return { name, status: msg, elapsed, chars: 0 };
  }
}

console.log("开始测试，每个站最长等待 15 秒...\n");

// 并发测试，最多 4 个同时跑
const results = [];
const concurrency = 4;
for (let i = 0; i < TEST_URLS.length; i += concurrency) {
  const batch = TEST_URLS.slice(i, i + concurrency);
  const batchResults = await Promise.all(batch.map(testUrl));
  results.push(...batchResults);
  batchResults.forEach(r => {
    console.log(`${r.status.padEnd(14)} | ${String(r.elapsed + "s").padStart(5)} | ${String(r.chars + " 字").padStart(8)} | ${r.name}`);
  });
}

console.log("\n=== 汇总 ===");
const ok  = results.filter(r => r.status.startsWith("✅")).length;
const warn = results.filter(r => r.status.startsWith("⚠️")).length;
const fail = results.length - ok - warn;
console.log(`✅ 成功: ${ok}  ⚠️  内容短: ${warn}  ❌/⏱️ 失败/超时: ${fail}  共 ${results.length} 个`);
