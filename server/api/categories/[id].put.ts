import { db } from "hub:db";
import { categories } from "hub:db:schema";
import { validateUpdateCategory } from "~~/server/utils/validator";
import { eq } from "drizzle-orm";

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

  const body = await readBody(event);
  const validation = validateUpdateCategory(body);

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation failed",
      data: validation.error.issues,
    });
  }

  try {
    const updatedCategory = await db
      .update(categories)
      .set({
        name: validation.data.name,
        type: validation.data.type,
        icon: validation.data.icon,
        color: validation.data.color,
      })
      .where(eq(categories.id, id))
      .returning();

    if (updatedCategory.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Category not found",
      });
    }

    return {
      success: true,
      data: updatedCategory[0],
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update category",
      data: error,
    });
  }
});
