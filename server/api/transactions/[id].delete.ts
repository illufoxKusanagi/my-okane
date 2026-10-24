import { db } from "~~/server/db";
import { transactions } from "~~/server/db/schema";
import { and, eq } from "drizzle-orm";
import { throwSafeServerError } from "~~/server/utils/safeError";

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id?.trim();
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Transaction ID is required",
    });
  }

  try {
    const userId = await getAuthUserId(event);

    const deleted = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Transaction not found",
      });
    }

    return {
      success: true,
      data: deleted[0],
    };
  } catch (error: unknown) {
    throwSafeServerError(error, {
      context: "delete transaction",
      fallbackMessage: "Failed to delete transaction",
    });
  }
});
