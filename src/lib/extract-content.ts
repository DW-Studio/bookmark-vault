const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (compatible; BookmarkVaultBot/1.0; +https://example.com/bot)";
const MAX_HTML_BYTES = 1024 * 1024; // 1MB

// 每次请求超时：15 秒（Jina 在国内网络较慢，5 秒太短）
const REQUEST_TIMEOUT_MS = 15_000;
// 最大重试次数（首次失败后再试 1 次）
const MAX_RETRIES = 1;
// 重试前等待时间
const RETRY_DELAY_MS = 1_500;

function isBlockedPrivateHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();

  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]"
  ) {
    return true;
  }

  if (
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("169.254.") ||
    host.startsWith("127.")
  ) {
    return true;
  }

  // 172.16.0.0 - 172.31.255.255
  const parts = host.split(".");
  if (parts.length === 4 && parts.every((part) => /^\d+$/.test(part))) {
    const first = Number(parts[0]);
    const second = Number(parts[1]);
    if (first === 172 && second >= 16 && second <= 31) {
      return true;
    }
  }

  return false;
}

function decodeHtmlEntities(input: string): string {
  const namedEntityMap: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
  };

  const withNamedEntities = input.replace(
    /&(amp|lt|gt|quot|#39|nbsp);/g,
    (entity) => namedEntityMap[entity] ?? entity,
  );

  return withNamedEntities
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 16)),
    );
}

function normalizeText(input: string): string {
  return decodeHtmlEntities(input)
    .replace(/\u00a0/g, " ")    // 非断行空格 → 普通空格
    .replace(/\r\n/g, "\n")     // 统一换行符
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")   // 只压缩行内横向空白，保留换行
    .trim();
}

/** 延迟工具 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 单次 Jina 请求，带超时控制 */
async function fetchFromJina(requestUrl: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(requestUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
        Accept: "text/plain,text/markdown",
        // 告诉 Jina 不等待动态内容，加快响应速度
        "X-No-Cache": "true",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`抓取失败: ${response.status} ${response.statusText}`);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      const declaredSize = Number(contentLength);
      if (Number.isFinite(declaredSize) && declaredSize > MAX_HTML_BYTES) {
        throw new Error("响应内容过大，已拒绝读取");
      }
    }

    const responseText = await response.text();
    const responseBytes = new TextEncoder().encode(responseText).byteLength;
    if (responseBytes > MAX_HTML_BYTES) {
      throw new Error("响应内容过大，已拒绝读取");
    }

    const jinaText = normalizeText(responseText);
    if (!jinaText) {
      throw new Error("未提取到正文内容");
    }

    return jinaText;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`请求超时（超过 ${REQUEST_TIMEOUT_MS / 1000} 秒），请检查网络后重试`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function extractMainContentFromUrl(url: string): Promise<string> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("无效 URL");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("仅支持 http/https URL");
  }

  if (isBlockedPrivateHost(parsedUrl.hostname)) {
    throw new Error("禁止访问内网或本地地址");
  }

  const requestUrl = `https://r.jina.ai/${parsedUrl.toString()}`;

  let lastError: Error = new Error("未知错误");

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // 重试前等一下，避免立刻打同一个请求
      await sleep(RETRY_DELAY_MS);
    }
    try {
      return await fetchFromJina(requestUrl);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 以下错误没有重试意义，直接抛出
      const noRetryMessages = [
        "无效 URL",
        "仅支持 http/https URL",
        "禁止访问内网或本地地址",
        "响应内容过大",
        "抓取失败: 4",  // 4xx 客户端错误不重试
      ];
      if (noRetryMessages.some((msg) => lastError.message.includes(msg))) {
        throw lastError;
      }

      // 超时或 5xx 错误：继续重试
      console.warn(`[extractContent] 第 ${attempt + 1} 次尝试失败: ${lastError.message}`);
    }
  }

  // 所有重试耗尽
  throw new Error(`内容抓取失败（已重试 ${MAX_RETRIES} 次）：${lastError.message}`);
}
