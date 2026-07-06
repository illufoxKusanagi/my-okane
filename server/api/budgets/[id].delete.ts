import { budgets } from "~~/server/db/schema";
import { db } from "~~/server/db";
import { and, eq } from "drizzle-orm";
import * as Sentry from "@sentry/nuxt";

export default defineEventHandler(async (event) => {
  try {
    const userId = await getAuthUserId(event);
    const id = Number(getRouterParam(event, "id"));

    if (isNaN(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid budget ID",
      });
    }

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

    await db.delete(budgets).where(eq(budgets.id, id));

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Delete budget error:", error);
    Sentry.captureException(error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete budget",
      data: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
  }
});
