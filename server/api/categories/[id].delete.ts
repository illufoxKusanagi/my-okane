import { db } from "~~/server/db";
import { categories } from "~~/server/db/schema";
import { and, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const idStr = event.context.params?.id;
  if (!idStr) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category ID is required",
    });
  }

  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid Category ID",
    });
  }

  try {
    const userId = await getAuthUserId(event);

    const deleted = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();

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
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete category",
      data: error,
    });
  }
});
