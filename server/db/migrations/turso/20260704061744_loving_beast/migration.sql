PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`icon` text DEFAULT 'i-lucide-folder',
	`color` text DEFAULT 'blue',
	`user_id` integer NOT NULL,
	CONSTRAINT `fk_categories_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_categories`(`id`, `name`, `type`, `icon`, `color`, `user_id`) SELECT `id`, `name`, `type`, `icon`, `color`, `user_id` FROM `categories`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
ALTER TABLE `__new_categories` RENAME TO `categories`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`transaction_name` text NOT NULL,
	`transaction_type` text NOT NULL,
	`amount` integer NOT NULL,
	`notes` text,
	`transaction_date` integer DEFAULT (unixepoch()) NOT NULL,
	`category_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_transactions_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_transactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_transactions`(`id`, `transaction_name`, `transaction_type`, `amount`, `notes`, `transaction_date`, `category_id`, `user_id`, `created_at`) SELECT `id`, `transaction_name`, `transaction_type`, `amount`, `notes`, `transaction_date`, `category_id`, `user_id`, `created_at` FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;