import { env } from "cloudflare:workers";
import {
  countRecentNotes,
  createPublicNote,
  deleteNoteById,
  deleteOwnedNote,
  listOwnedNoteIds,
  listPublicNotes,
  type PublicNote,
  type StoredNote,
} from "@/db/notes";

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
    headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization, X-Note-Owner-Token");
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

function cleanId(value: string | null) {
  return value && /^[0-9a-f-]{36}$/i.test(value) ? value : "";
}

function displayDate(createdAt: number) {
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", timeZone: "Asia/Shanghai" })
    .format(new Date(createdAt * 1000))
    .replace("/", ".");
}

function toClientNote(note: StoredNote, canDelete: boolean) {
  return {
    id: note.id,
    name: note.name,
    message: note.message,
    createdAt: note.createdAt,
    date: displayDate(note.createdAt),
    canDelete,
  };
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((item) => item.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function readOwnerToken(request: Request, suppliedToken?: unknown) {
  const token = typeof suppliedToken === "string" ? suppliedToken : request.headers.get("X-Note-Owner-Token") || "";
  return /^[A-Za-z0-9_-]{32,128}$/.test(token) ? token : "";
}

async function getOwnerHash(request: Request, suppliedToken?: unknown) {
  const token = readOwnerToken(request, suppliedToken);
  if (!token) return null;
  if (!env.NOTE_OWNER_SALT) throw new Error("Owner salt is unavailable");
  return sha256(`${env.NOTE_OWNER_SALT}:${token}`);
}

async function isAdmin(request: Request) {
  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const expectedHash = (env.NOTE_ADMIN_TOKEN_HASH || "").trim().toLowerCase();
  if (!token || !/^[0-9a-f]{64}$/.test(expectedHash)) return false;
  const actualHash = await sha256(token);
  return constantTimeEqual(actualHash, expectedHash);
}

async function hashVisitor(request: Request) {
  if (!env.NOTE_RATE_SALT) throw new Error("Rate-limit salt is unavailable");
  const address = request.headers.get("CF-Connecting-IP") || "unknown";
  return sha256(`${env.NOTE_RATE_SALT}:${address}`);
}

export function OPTIONS(request: Request) {
  if (!isAllowedBrowserRequest(request)) return json(request, { error: "Origin not allowed" }, 403);
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const admin = await isAdmin(request);
    const ownerHash = admin ? null : await getOwnerHash(request);
    const requestedLimit = Number.parseInt(url.searchParams.get("limit") || "42", 10);
    const maximum = admin ? 300 : 48;
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), maximum) : 42;
    const notes = await listPublicNotes(limit);
    return json(request, {
      notes: notes.map((note) => toClientNote(note, admin || Boolean(ownerHash && note.ownerHash === ownerHash))),
      admin,
    });
  } catch {
    return json(request, { error: "留言墙暂时无法连接" }, 503);
  }
}

export async function POST(request: Request) {
  if (!isAllowedBrowserRequest(request)) return json(request, { error: "无法确认留言来源" }, 403);
  const contentType = request.headers.get("Content-Type")?.toLowerCase() || "";
  if (!contentType.startsWith("application/json") && !contentType.startsWith("text/plain")) {
    return json(request, { error: "留言格式不正确" }, 415);
  }
  const contentLength = Number(request.headers.get("Content-Length") || "0");
  if (contentLength > 2048) return json(request, { error: "留言内容太长啦" }, 413);

  try {
    const body = (await request.json()) as { name?: unknown; message?: unknown; startedAt?: unknown; ownerToken?: unknown };
    const action = new URL(request.url).searchParams.get("action");
    const ownerHash = await getOwnerHash(request, body.ownerToken);
    if (!ownerHash) return json(request, { error: "无法生成这条留言的删除凭证" }, 400);

    if (action === "ownership") {
      return json(request, { ownedIds: await listOwnedNoteIds(ownerHash) });
    }

    if (action === "delete") {
      const id = cleanId(new URL(request.url).searchParams.get("id"));
      if (!id) return json(request, { error: "留言编号无效" }, 400);
      const deleted = await deleteOwnedNote(id, ownerHash);
      if (!deleted) return json(request, { error: "只能删除自己在当前设备发送的留言" }, 404);
      return json(request, { deleted: true });
    }

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
    await createPublicNote({ ...note, visitorHash, ownerHash });
    return json(request, { note: toClientNote({ ...note, ownerHash }, true) }, 201);
  } catch {
    return json(request, { error: "暂时无法贴上这条留言" }, 503);
  }
}

export async function DELETE(request: Request) {
  if (!isAllowedBrowserRequest(request)) return json(request, { error: "无法确认删除来源" }, 403);
  const id = cleanId(new URL(request.url).searchParams.get("id"));
  if (!id) return json(request, { error: "留言编号无效" }, 400);

  try {
    const admin = await isAdmin(request);
    let deleted = false;
    if (admin) {
      deleted = await deleteNoteById(id);
    } else {
      const ownerHash = await getOwnerHash(request);
      if (!ownerHash) return json(request, { error: "这不是你在当前设备发送的留言" }, 403);
      deleted = await deleteOwnedNote(id, ownerHash);
    }
    if (!deleted) return json(request, { error: admin ? "留言不存在或已被删除" : "只能删除自己在当前设备发送的留言" }, 404);
    return json(request, { deleted: true });
  } catch {
    return json(request, { error: "暂时无法删除这条留言" }, 503);
  }
}
