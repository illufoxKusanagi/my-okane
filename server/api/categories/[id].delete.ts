import { db } from "~~/server/db";
import { categories, transactions, budgets } from "~~/server/db/schema";
import { and, eq } from "drizzle-orm";
import { throwSafeServerError } from "~~/server/utils/safeError";

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id?.trim();
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category ID is required",
    });
  }

  try {
    const userId = await getAuthUserId(event);

    const deleted = await db.transaction(async (tx) => {
      // Explicitly clean up child rows to prevent orphaned records in environments
      // where PRAGMA foreign_keys cascade is disabled.
      await tx
        .delete(budgets)
        .where(and(eq(budgets.categoryId, id), eq(budgets.userId, userId)));

      await tx
        .delete(transactions)
        .where(
          and(eq(transactions.categoryId, id), eq(transactions.userId, userId)),
        );

      const res = await tx
        .delete(categories)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)))
        .returning();

      return res;
    });

    if (deleted.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Category not found",
      });
    }

    return {
      success: true,
      data: deleted[0],
    };
  } catch (error: unknown) {
    throwSafeServerError(error, {
      context: "delete category",
      fallbackMessage: "Failed to delete category",
    });
  }
});
