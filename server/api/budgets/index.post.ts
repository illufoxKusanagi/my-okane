import { budgets, categories } from "~~/server/db/schema";
import { db } from "~~/server/db";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import * as Sentry from "@sentry/nuxt";

const budgetSchema = z.object({
  categoryId: z.number().nullable().optional(),
  amount: z.number().min(0, "Amount must be greater than or equal to 0"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
});

export default defineEventHandler(async (event) => {
  try {
    const userId = await getAuthUserId(event);
    const body = await readBody(event);

    const validation = budgetSchema.safeParse(body);
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage:
          validation.error.issues[0]?.message || "Validation failed",
      });
    }

    const { categoryId, amount, month } = validation.data;

    if (categoryId) {
      const cat = await db
        .select()
        .from(categories)
        .where(
          and(eq(categories.id, categoryId), eq(categories.userId, userId)),
        )
        .limit(1);

      if (cat.length === 0) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden: Category does not belong to this user",
        });
      }
    }

    let existing;
    if (categoryId) {
      existing = await db
        .select()
        .from(budgets)
        .where(
          and(
            eq(budgets.userId, userId),
            eq(budgets.categoryId, categoryId),
            eq(budgets.month, month),
          ),
        )
        .limit(1);
    } else {
      existing = await db
        .select()
        .from(budgets)
        .where(
          and(
            eq(budgets.userId, userId),
            isNull(budgets.categoryId),
            eq(budgets.month, month),
          ),
        )
        .limit(1);
    }

    const existingBudget = existing[0];
    if (existingBudget) {
      const updated = await db
        .update(budgets)
        .set({ amount })
        .where(eq(budgets.id, existingBudget.id))
        .returning();

      return {
        success: true,
        data: updated[0],
      };
    } else {
      const inserted = await db
        .insert(budgets)
        .values({
          userId,
          categoryId: categoryId || null,
          amount,
          month,
        })
        .returning();

      return {
        success: true,
        data: inserted[0],
      };
    }
  } catch (error: any) {
    console.error("Save budget error:", error);
    Sentry.captureException(error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to save budget",
      data: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
  }
});
