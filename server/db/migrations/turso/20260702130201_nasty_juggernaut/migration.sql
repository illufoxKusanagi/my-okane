CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`icon` text DEFAULT 'i-lucide-folder',
	`color` text DEFAULT 'blue'
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`transaction_name` text NOT NULL,
	`transaction_type` text NOT NULL,
	`amount` integer NOT NULL,
	`notes` text,
	`transaction_date` integer DEFAULT (unixepoch()) NOT NULL,
	`category_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_transactions_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
);
