import { env } from "cloudflare:workers";

export type PublicNote = {
  id: string;
  name: string;
  message: string;
  createdAt: number;
};

function getDatabase() {
  if (!env.DB) throw new Error("D1 binding DB is unavailable");
  return env.DB;
}

export async function listPublicNotes(limit: number) {
  const result = await getDatabase()
    .prepare("SELECT id, name, message, created_at AS createdAt FROM notes ORDER BY created_at DESC LIMIT ?")
    .bind(limit)
    .all<PublicNote>();
  return result.results;
}

export async function countRecentNotes(visitorHash: string, since: number) {
  const row = await getDatabase()
    .prepare("SELECT COUNT(*) AS total FROM notes WHERE visitor_hash = ? AND created_at >= ?")
    .bind(visitorHash, since)
    .first<{ total: number }>();
  return Number(row?.total ?? 0);
}

export async function createPublicNote(note: PublicNote & { visitorHash: string }) {
  await getDatabase()
    .prepare("INSERT INTO notes (id, name, message, visitor_hash, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(note.id, note.name, note.message, note.visitorHash, note.createdAt)
    .run();
}
