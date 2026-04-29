import { NextResponse } from "next/server";

import { extractMainContentFromUrl } from "@/lib/extract-content";
import { getDb } from "@/lib/db";

// 告知 Next.js 此路由最长执行时间（秒）
// 本地开发无限制，Vercel Hobby 最大 60s，Pro 最大 300s
export const maxDuration = 60;

type BookmarkInsert = {
  url: string;
};

const URL_MAX_LENGTH = 2048;

type ApiErrorCode =
  | "INVALID_JSON"
  | "INVALID_URL"
  | "CONTENT_FETCH_FAILED"
  | "DATABASE_ERROR"
  | "DUPLICATE_URL"
  | "INTERNAL_ERROR";

function jsonError(
  status: number,
  message: string,
  code: ApiErrorCode,
  requestId: string,
  details?: string,
) {
  return NextResponse.json(
    {
      error: message,
      code,
      requestId,
      ...(details ? { details } : {}),
    },
    { status },
  );
}

function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > URL_MAX_LENGTH) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (!parsed.hostname) {
      return null;
    }
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}

type BookmarkRow = {
  id: string;
  url: string;
  content: string;
  created_at: string;
};

export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const db = getDb();
    const rows = db
      .prepare(
        "SELECT id, url, content, created_at FROM bookmarks ORDER BY created_at DESC",
      )
      .all() as BookmarkRow[];

    return NextResponse.json({ bookmarks: rows, requestId });
  } catch (error) {
    return jsonError(
      500,
      "获取书签列表失败",
      "DATABASE_ERROR",
      requestId,
      error instanceof Error ? error.message : undefined,
    );
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return jsonError(400, "请求体必须是 JSON 格式", "INVALID_JSON", requestId);
  }

  let body: Partial<BookmarkInsert>;
  try {
    body = (await request.json()) as Partial<BookmarkInsert>;
  } catch {
    return jsonError(400, "JSON 格式错误", "INVALID_JSON", requestId);
  }

  const normalizedUrl = normalizeUrl(body.url ?? "");

  if (!normalizedUrl) {
    return jsonError(
      400,
      "URL 不合法，请输入有效 http/https 链接",
      "INVALID_URL",
      requestId,
    );
  }

  try {
    const content = await extractMainContentFromUrl(normalizedUrl);
    if (!content.trim()) {
      return jsonError(
        400,
        "抓取正文失败，内容为空",
        "CONTENT_FETCH_FAILED",
        requestId,
      );
    }

    const db = getDb();
    const id = crypto.randomUUID();

    try {
      db.prepare(
        "INSERT INTO bookmarks (id, url, content) VALUES (?, ?, ?)",
      ).run(id, normalizedUrl, content);
    } catch (err) {
      // SQLite UNIQUE 约束冲突错误码
      if (
        err instanceof Error &&
        err.message.includes("UNIQUE constraint failed")
      ) {
        return jsonError(409, "该书签已存在", "DUPLICATE_URL", requestId);
      }
      throw err;
    }

    const row = db
      .prepare(
        "SELECT id, url, content, created_at FROM bookmarks WHERE id = ?",
      )
      .get(id) as BookmarkRow;

    return NextResponse.json({ bookmark: row, requestId }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("无效 URL") ||
        error.message.includes("仅支持 http/https URL") ||
        error.message.includes("禁止访问内网或本地地址")
      ) {
        return jsonError(400, error.message, "INVALID_URL", requestId);
      }
      return jsonError(400, error.message, "CONTENT_FETCH_FAILED", requestId);
    }
    return jsonError(500, "服务暂时不可用", "INTERNAL_ERROR", requestId);
  }
}
