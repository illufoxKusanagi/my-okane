import { db } from "~~/server/db";
import { transactions } from "~~/server/db/schema";
import { sql } from "drizzle-orm";

export default defineEventHandler(async () => {
  try {
    const summary = await db
      .select({
        type: transactions.type,
        total: sql<number>`CAST(coalesce(sum(${transactions.amount}), 0) AS INTEGER)`,
      })
      .from(transactions)
      .groupBy(transactions.type);

    let totalIncome = 0;
    let totalSpending = 0;

    summary.forEach((item: { type: string; total: number }) => {
      if (item.type === "income") {
        totalIncome = item.total;
      } else if (item.type === "spending") {
        totalSpending = item.total;
      }
    });

    return {
      totalIncome,
      totalSpending,
      balance: totalIncome - totalSpending,
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to generate summary",
      data: error,
    });
  }
});
