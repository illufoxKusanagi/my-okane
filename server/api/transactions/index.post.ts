import { db } from "~~/server/db";
import { transactions } from "~~/server/db/schema";
import { validateTransaction } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const validation = validateTransaction(body);

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation failed",
      data: validation.error.issues,
    });
  }

  try {
    const newTransaction = await db
      .insert(transactions)
      .values({
        name: validation.data.name,
        type: validation.data.type,
        amount: validation.data.amount,
        categoryId: validation.data.categoryId,
        notes: validation.data.notes,
        transactionDate: validation.data.transactionDate,
      })
      .returning();

    return {
      success: true,
      data: newTransaction[0],
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create transaction",
      data: error,
    });
  }
});
