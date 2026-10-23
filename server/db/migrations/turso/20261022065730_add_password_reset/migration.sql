ALTER TABLE `users` ADD `reset_token_hash` text;--> statement-breakpoint
ALTER TABLE `users` ADD `reset_token_expires_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `credentials_version` integer DEFAULT 0 NOT NULL;