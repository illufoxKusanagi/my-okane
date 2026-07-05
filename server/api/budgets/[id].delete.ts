import { budgets } from "~~/server/db/schema";
import { db } from "~~/server/db";
import { and, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const userId = await getAuthUserId(event);
  const id = Number(getRouterParam(event, "id"));

  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid budget ID",
    });
  }

  // 1. Verify ownership before deleting
  const existing = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Budget not found",
    });
  }

  // 2. Perform deletion
  await db.delete(budgets).where(eq(budgets.id, id));

  return {
    success: true,
  };
});
