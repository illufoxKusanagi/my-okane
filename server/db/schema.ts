import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("transaction_name").notNull(),
  type: text("transaction_type").notNull(), // 'income' | 'spending'
  amount: integer("amount").notNull(),
  notes: text("notes"),
  transactionDate: integer("transaction_date", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  categoryId: integer("category_id")
    .references(() => categories.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'income' | 'spending'
  icon: text("icon").default("i-lucide-folder"),
  color: text("color").default("blue"),
});

export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type NewCategory = typeof categories.$inferInsert;
