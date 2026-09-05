import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const notes = sqliteTable(
  "notes",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    message: text("message").notNull(),
    visitorHash: text("visitor_hash").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("idx_notes_created_at").on(table.createdAt),
    index("idx_notes_visitor_created_at").on(table.visitorHash, table.createdAt),
  ],
);
