import { db } from "hub:db";
import { transactions } from "hub:db:schema";
import { sql, desc } from "drizzle-orm";

export default defineEventHandler(async () => {
  try {
    const results = await db
      .select({
        month: sql<string>`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM')`,
        type: transactions.type,
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)::int`,
      })
      .from(transactions)
      .groupBy(
        sql`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM')`,
        transactions.type
      )
      .orderBy(desc(sql`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM')`));

    const formatted: Record<string, { income: number; spending: number }> = {};

    results.forEach((row) => {
      if (!row.month) return;
      if (!formatted[row.month]) {
        formatted[row.month] = { income: 0, spending: 0 };
      }
      const data = formatted[row.month];
      if (data) {
        if (row.type === "income") {
          data.income = row.total;
        } else if (row.type === "spending") {
          data.spending = row.total;
        }
      }
    });

    return Object.entries(formatted)
      .map(([month, data]) => ({
        month,
        income: data.income,
        spending: data.spending,
      }))
      .reverse();
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to generate monthly trend stats",
      data: error,
    });
  }
});
