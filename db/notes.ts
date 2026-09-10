import { env } from "cloudflare:workers";

export type PublicNote = {
  id: string;
  name: string;
  message: string;
  createdAt: number;
};

export type StoredNote = PublicNote & {
  ownerHash: string | null;
};

function getDatabase() {
  if (!env.DB) throw new Error("D1 binding DB is unavailable");
  return env.DB;
}

export async function listPublicNotes(limit: number) {
  const result = await getDatabase()
    .prepare("SELECT id, name, message, owner_hash AS ownerHash, created_at AS createdAt FROM notes ORDER BY created_at DESC LIMIT ?")
    .bind(limit)
    .all<StoredNote>();
  return result.results;
}

export async function countRecentNotes(visitorHash: string, since: number) {
  const row = await getDatabase()
    .prepare("SELECT COUNT(*) AS total FROM notes WHERE visitor_hash = ? AND created_at >= ?")
    .bind(visitorHash, since)
    .first<{ total: number }>();
  return Number(row?.total ?? 0);
}

export async function createPublicNote(note: PublicNote & { visitorHash: string; ownerHash: string }) {
  await getDatabase()
    .prepare("INSERT INTO notes (id, name, message, visitor_hash, owner_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(note.id, note.name, note.message, note.visitorHash, note.ownerHash, note.createdAt)
    .run();
}

export async function listOwnedNoteIds(ownerHash: string, limit = 100) {
  const result = await getDatabase()
    .prepare("SELECT id FROM notes WHERE owner_hash = ? ORDER BY created_at DESC LIMIT ?")
    .bind(ownerHash, limit)
    .all<{ id: string }>();
  return result.results.map((row) => row.id);
}

export async function deleteOwnedNote(id: string, ownerHash: string) {
  const result = await getDatabase()
    .prepare("DELETE FROM notes WHERE id = ? AND owner_hash = ?")
    .bind(id, ownerHash)
    .run();
  return Number(result.meta.changes || 0) > 0;
}

export async function deleteNoteById(id: string) {
  const result = await getDatabase()
    .prepare("DELETE FROM notes WHERE id = ?")
    .bind(id)
    .run();
  return Number(result.meta.changes || 0) > 0;
}
