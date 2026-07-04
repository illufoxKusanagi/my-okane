import { db } from "~~/server/db";
import { transactions, categories } from "~~/server/db/schema";
import { validateTransaction } from "~~/server/utils/validator";
import { and, eq } from "drizzle-orm";

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
    const userId = await getAuthUserId(event);

    const category = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, validation.data.categoryId), eq(categories.userId, userId)))
      .limit(1);

    if (category.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Category not found or does not belong to the user",
      });
    }

    const newTransaction = await db
      .insert(transactions)
      .values({
        name: validation.data.name,
        type: validation.data.type,
        amount: validation.data.amount,
        categoryId: validation.data.categoryId,
        notes: validation.data.notes,
        transactionDate: validation.data.transactionDate,
        userId: userId,
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
