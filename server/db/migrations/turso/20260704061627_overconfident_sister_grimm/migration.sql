CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`password_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `categories` ADD `user_id` integer REFERENCES users(id) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `transactions` ADD `user_id` integer REFERENCES users(id) ON DELETE CASCADE;