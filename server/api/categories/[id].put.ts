import { db } from "~~/server/db";
import { categories, transactions } from "~~/server/db/schema";
import { validateUpdateCategory } from "~~/server/utils/validator";
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
    const userId = await getAuthUserId(event);

    // Renaming to a name that already exists would merge two categories
    // in name-based groupings (charts, lookups).
    if (validation.data.name !== undefined) {
      const duplicate = await db
        .select({ id: categories.id })
        .from(categories)
        .where(
          and(
            eq(categories.userId, userId),
            eq(categories.name, validation.data.name),
          ),
        )
        .limit(1);
      if (duplicate[0] && duplicate[0].id !== id) {
        throw createError({
          statusCode: 409,
          statusMessage: "A category with this name already exists.",
        });
      }
    }

    // Changing category type (spending <-> income) when transactions already exist
    // causes transaction-type mismatch and inverts budget calculations.
    if (validation.data.type !== undefined) {
      const currentCategory = await db
        .select({ type: categories.type })
        .from(categories)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)))
        .limit(1);

      if (
        currentCategory[0] &&
        currentCategory[0].type !== validation.data.type
      ) {
        const linkedTx = await db
          .select({ id: transactions.id })
          .from(transactions)
          .where(
            and(
              eq(transactions.categoryId, id),
              eq(transactions.userId, userId),
            ),
          )
          .limit(1);

        if (linkedTx.length > 0) {
          throw createError({
            statusCode: 400,
            statusMessage:
              "Cannot change category type when linked transactions exist.",
          });
        }
      }
    }

    const updatedCategory = await db
      .update(categories)
      .set({
        name: validation.data.name,
        type: validation.data.type,
        icon: validation.data.icon,
        color: validation.data.color,
      })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
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
  } catch (error: unknown) {
    throwSafeServerError(error, {
      context: "update category",
      fallbackMessage: "Failed to update category",
      conflictMessage: "A category with this name already exists.",
    });
  }
});
