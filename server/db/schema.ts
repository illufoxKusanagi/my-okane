import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  name: text("transaction_name").notNull(),
  type: text("transaction_type").notNull(), // 'income' | 'spending'
  amount: integer("amount").notNull(),
  notes: text("notes"),
  transactionDate: timestamp("transaction_date").defaultNow(),
  categoryId: integer("category_id")
    .references(() => categories.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'income' | 'spending'
  icon: text("icon").default("i-lucide-folder"),
  color: text("color").default("blue"),
});

export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type NewCategory = typeof categories.$inferInsert;
