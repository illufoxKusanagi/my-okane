import { db } from "~~/server/db";
import { transactions, categories } from "~~/server/db/schema";
import { eq, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const list = await db
      .select({
        id: transactions.id,
        name: transactions.name,
        type: transactions.type,
        amount: transactions.amount,
        notes: transactions.notes,
        transactionDate: transactions.transactionDate,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .orderBy(desc(transactions.transactionDate));

    return list;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch transactions",
      data: error,
    });
  }
});
