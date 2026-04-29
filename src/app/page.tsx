"use client";

import { FormEvent, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Bookmark = {
  id: string;
  url: string;
  content: string;
  created_at: string;
};

function cleanContent(content: string): string {
  let cleaned = content;

  // Jina Reader 返回的元数据头部（内容可能已被压缩为单行，也可能保留换行）
  cleaned = cleaned.replace(/\s*Title:[\s\S]*?(?=URL Source:|Published Time:|Markdown Content:|$)/i, "");
  cleaned = cleaned.replace(/\s*URL Source:[\s\S]*?(?=Published Time:|Markdown Content:|$)/i, "");
  cleaned = cleaned.replace(/\s*Published Time:[\s\S]*?(?=Markdown Content:|$)/i, "");
  cleaned = cleaned.replace(/\s*Markdown Content:\s*/i, "");

  // X (Twitter) 文章页特有的噪音前缀
  cleaned = cleaned.replace(/^#+\s*Article\s*/i, "");
  cleaned = cleaned.replace(/^#+\s*Conversation\s*/i, "");
  cleaned = cleaned.replace(/##\s*Article\s*/gi, "");
  cleaned = cleaned.replace(/##\s*Conversation\s*/gi, "");

  return cleaned.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * 对纯文字内容自动补充结构：
 * - 第一个非图片的段落 → 渲染为 # 标题
 * - 其余内容保持不变
 * 仅用于显示，不修改存储内容
 */
function autoAddStructure(content: string): string {
  const paragraphs = content.split(/\n\n+/);
  let foundTitle = false;
  const result = paragraphs.map((para) => {
    const trimmed = para.trim();
    // 跳过图片行（Markdown 图片语法）
    if (trimmed.startsWith("[![") || trimmed.startsWith("![")) return para;
    // 跳过已有 Markdown 标题的行
    if (trimmed.startsWith("#")) return para;
    // 把第一个文字段落提升为标题
    if (!foundTitle && trimmed.length > 0) {
      foundTitle = true;
      return `# ${trimmed}`;
    }
    return para;
  });
  return result.join("\n\n");
}



/** 把 Markdown 语法标记剥掉，只留纯文字，用于卡片预览 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\[!\[.*?\]\(.*?\)\]\(.*?\)/g, "")   // [![图片](url)](链接) 完整去除
    .replace(/!\[.*?\]\(.*?\)/g, "")               // ![图片](url) 去除
    .replace(/\[([^\]]*)\]\(.*?\)/g, "$1")          // [文字](链接) → 只留文字
    .replace(/^#{1,6}\s+/gm, "")                   // 标题 # 号
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")       // **加粗** / *斜体*
    .replace(/_{1,2}([^_]+)_{1,2}/g, "$1")         // __加粗__ / _斜体_
    .replace(/`([^`]+)`/g, "$1")                   // `行内代码`
    .replace(/^[-*+]\s+/gm, "")                    // 无序列表符号
    .replace(/^\d+\.\s+/gm, "")                    // 有序列表符号
    .replace(/^>\s*/gm, "")                         // 引用 > 符号
    .replace(/\n{2,}/g, " ")                        // 多余换行 → 空格（预览单行）
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function getContentPreview(content: string, maxLength = 300): string {
  const cleaned = stripMarkdown(cleanContent(content));

  if (!cleaned) return "（暂无正文内容）";

  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return `${cleaned.slice(0, maxLength)}...`;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);

  async function loadBookmarks() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/bookmarks");
      const payload = (await response.json()) as { bookmarks?: Bookmark[]; error?: string };

      if (!response.ok) {
        setError(payload.error ?? "加载书签失败");
        return;
      }

      setBookmarks(payload.bookmarks ?? []);
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadBookmarks();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "保存失败");
        return;
      }

      setUrl("");
      await loadBookmarks();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 md:px-8 md:py-12">
      <section className="mb-8 rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-700">
              PRODUCT PREVIEW
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Bookmark Vault
            </h1>
            <p className="mt-2 text-sm text-slate-600 md:text-base">
              收藏、管理并快速访问你的关键链接。
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
            <p className="text-xs font-medium text-slate-500">已收录</p>
            <p className="text-2xl font-semibold text-slate-900">{bookmarks.length}</p>
          </div>
        </div>

        <form className="flex flex-col gap-3 md:flex-row" onSubmit={handleSubmit}>
          <input
            type="url"
            placeholder="输入书签 URL，例如 https://nextjs.org"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            required
            className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-slate-900 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 rounded-xl bg-slate-900 px-5 font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "保存中..." : "保存书签"}
          </button>
        </form>

        {error && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 md:text-xl">书签列表</h2>
          <button
            type="button"
            onClick={() => void loadBookmarks()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            刷新
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            正在加载书签...
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center text-slate-500 shadow-sm">
            暂无书签，先添加一个链接开始吧。
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {bookmarks.map((bookmark) => (
              <li
                key={bookmark.id}
                onClick={() => setSelectedBookmark(bookmark)}
                className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mb-3 block w-fit text-base font-medium text-slate-900 transition hover:underline group-hover:text-indigo-700"
                >
                  {bookmark.url}
                </a>
                <p className="mb-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                  {getContentPreview(bookmark.content ?? "（暂无正文内容）")}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <time>{new Date(bookmark.created_at).toLocaleString()}</time>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                    已保存
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modal */}
      {selectedBookmark && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedBookmark(null)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="truncate pr-4 text-lg font-semibold text-slate-900">
                <a
                  href={selectedBookmark.url}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-indigo-600 hover:underline"
                >
                  {selectedBookmark.url}
                </a>
              </h3>
              <button
                onClick={() => setSelectedBookmark(null)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noreferrer">{children}</a>
                    ),
                    img: ({ src, alt }) => (
                      <img
                        src={src}
                        alt={alt ?? ""}
                        referrerPolicy="no-referrer"
                        style={{ maxWidth: "100%", borderRadius: 8, margin: "16px auto", display: "block" }}
                      />
                    ),
                  }}
                >
                  {autoAddStructure(cleanContent(selectedBookmark.content ?? "")) || "（暂无正文内容）"}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
