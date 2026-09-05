CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`message` text NOT NULL,
	`visitor_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notes_created_at` ON `notes` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_notes_visitor_created_at` ON `notes` (`visitor_hash`,`created_at`);--> statement-breakpoint
PRAGMA optimize;
