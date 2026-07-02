import { db } from "~~/server/db";
import { transactions, categories } from "~~/server/db/schema";
import { eq, sql } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const type = query.type as string | undefined;

  try {
    const results = await db
      .select({
        label: categories.name,
        color: categories.color,
        icon: categories.icon,
        type: categories.type,
        value: sql<number>`CAST(coalesce(sum(${transactions.amount}), 0) AS INTEGER)`,
      })
      .from(categories)
      .leftJoin(transactions, eq(transactions.categoryId, categories.id))
      .groupBy(categories.id, categories.name, categories.color, categories.icon, categories.type);

    if (type === "income" || type === "spending") {
      return results.filter((r: { type: string }) => r.type === type);
    }

    return results;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to generate category breakdown",
      data: error,
    });
  }
});
