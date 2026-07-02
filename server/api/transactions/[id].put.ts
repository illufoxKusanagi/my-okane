import { db } from "~~/server/db";
import { transactions } from "~~/server/db/schema";
import { validateUpdateTransaction } from "~~/server/utils/validator";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const idStr = event.context.params?.id;
  if (!idStr) {
    throw createError({
      statusCode: 400,
      statusMessage: "Transaction ID is required",
    });
  }

  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid Transaction ID",
    });
  }

  const body = await readBody(event);
  const validation = validateUpdateTransaction(body);

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation failed",
      data: validation.error.issues,
    });
  }

  try {
    const updatedTransaction = await db
      .update(transactions)
      .set({
        name: validation.data.name,
        type: validation.data.type,
        amount: validation.data.amount,
        categoryId: validation.data.categoryId,
        notes: validation.data.notes,
        transactionDate: validation.data.transactionDate,
      })
      .where(eq(transactions.id, id))
      .returning();

    if (updatedTransaction.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Transaction not found",
      });
    }

    return {
      success: true,
      data: updatedTransaction[0],
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update transaction",
      data: error,
    });
  }
});
