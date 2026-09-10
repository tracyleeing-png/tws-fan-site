ALTER TABLE `notes` ADD `owner_hash` text;
--> statement-breakpoint
CREATE INDEX `idx_notes_owner_hash` ON `notes` (`owner_hash`);
--> statement-breakpoint
PRAGMA optimize;
