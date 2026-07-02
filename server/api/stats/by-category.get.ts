import { db } from "hub:db";
import { transactions, categories } from "hub:db:schema";
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
        value: sql<number>`COALESCE(SUM(${transactions.amount}), 0)::int`,
      })
      .from(categories)
      .leftJoin(transactions, eq(transactions.categoryId, categories.id))
      .groupBy(categories.id, categories.name, categories.color, categories.icon, categories.type);

    if (type === "income" || type === "spending") {
      return results.filter((r) => r.type === type);
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
