import { db } from "~~/server/db";
import { transactions } from "~~/server/db/schema";
import { sql, desc } from "drizzle-orm";

export default defineEventHandler(async () => {
  try {
    // In SQLite, dates stored via mode: 'timestamp' are unix epochs in seconds.
    // We format using strftime('%Y-%m', datetime(transaction_date, 'unixepoch'))
    const results = await db
      .select({
        month: sql<string>`strftime('%Y-%m', datetime(${transactions.transactionDate}, 'unixepoch'))`,
        type: transactions.type,
        total: sql<number>`CAST(coalesce(sum(${transactions.amount}), 0) AS INTEGER)`,
      })
      .from(transactions)
      .groupBy(
        sql`strftime('%Y-%m', datetime(${transactions.transactionDate}, 'unixepoch'))`,
        transactions.type
      )
      .orderBy(desc(sql`strftime('%Y-%m', datetime(${transactions.transactionDate}, 'unixepoch'))`));

    const formatted: Record<string, { income: number; spending: number }> = {};

    results.forEach((row: { month: string | null; type: string; total: number }) => {
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
