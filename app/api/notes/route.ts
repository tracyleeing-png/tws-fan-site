import { env } from "cloudflare:workers";
import { countRecentNotes, createPublicNote, listPublicNotes, type PublicNote } from "@/db/notes";

export const dynamic = "force-dynamic";

const ALLOWED_ORIGINS = new Set([
  "https://tracyleeing-png.github.io",
  "https://tws-247-with-tws.tracyleeing.chatgpt.site",
  "http://localhost:4173",
  "http://localhost:5173",
]);

function corsHeaders(request: Request) {
  const origin = request.headers.get("Origin");
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  });
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Accept");
    headers.set("Access-Control-Max-Age", "86400");
  }
  return headers;
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request) });
}

function isAllowedBrowserRequest(request: Request) {
  const origin = request.headers.get("Origin");
  return Boolean(origin && ALLOWED_ORIGINS.has(origin));
}

function cleanName(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 16);
}

function cleanMessage(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, 100);
}

function displayDate(createdAt: number) {
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", timeZone: "Asia/Shanghai" })
    .format(new Date(createdAt * 1000))
    .replace("/", ".");
}

function toClientNote(note: PublicNote) {
  return { ...note, date: displayDate(note.createdAt) };
}

async function hashVisitor(request: Request) {
  if (!env.NOTE_RATE_SALT) throw new Error("Rate-limit salt is unavailable");
  const address = request.headers.get("CF-Connecting-IP") || "unknown";
  const bytes = new TextEncoder().encode(`${env.NOTE_RATE_SALT}:${address}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

export function OPTIONS(request: Request) {
  if (!isAllowedBrowserRequest(request)) return json(request, { error: "Origin not allowed" }, 403);
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const requestedLimit = Number.parseInt(url.searchParams.get("limit") || "24", 10);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 48) : 24;
    const notes = await listPublicNotes(limit);
    return json(request, { notes: notes.map(toClientNote) });
  } catch {
    return json(request, { error: "留言墙暂时无法连接" }, 503);
  }
}

export async function POST(request: Request) {
  if (!isAllowedBrowserRequest(request)) return json(request, { error: "无法确认留言来源" }, 403);
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return json(request, { error: "留言格式不正确" }, 415);
  }
  const contentLength = Number(request.headers.get("Content-Length") || "0");
  if (contentLength > 2048) return json(request, { error: "留言内容太长啦" }, 413);

  try {
    const body = (await request.json()) as { name?: unknown; message?: unknown; startedAt?: unknown };
    const name = cleanName(body.name) || "一位 42";
    const message = cleanMessage(body.message);
    const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
    if (!message) return json(request, { error: "先写下一句话吧" }, 400);
    if (Date.now() - startedAt < 1200) return json(request, { error: "慢一点，再确认一下留言吧" }, 400);

    const visitorHash = await hashVisitor(request);
    const createdAt = Math.floor(Date.now() / 1000);
    const recentCount = await countRecentNotes(visitorHash, createdAt - 600);
    if (recentCount >= 3) return json(request, { error: "留言有点快，十分钟后再来吧" }, 429);

    const note: PublicNote = { id: crypto.randomUUID(), name, message, createdAt };
    await createPublicNote({ ...note, visitorHash });
    return json(request, { note: toClientNote(note) }, 201);
  } catch {
    return json(request, { error: "暂时无法贴上这条留言" }, 503);
  }
}
