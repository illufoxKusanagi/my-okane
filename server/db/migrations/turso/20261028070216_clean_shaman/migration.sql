CREATE TABLE `wallets` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`account_number` text,
	`color` text DEFAULT 'emerald',
	`icon` text DEFAULT 'i-lucide-credit-card',
	`initial_balance` integer DEFAULT 0 NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_wallets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `transactions` ADD `wallet_id` text REFERENCES wallets(id) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `transfer_wallet_id` text REFERENCES wallets(id) ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX `transactions_wallet_id_idx` ON `transactions` (`wallet_id`);--> statement-breakpoint
CREATE INDEX `wallets_user_id_idx` ON `wallets` (`user_id`);