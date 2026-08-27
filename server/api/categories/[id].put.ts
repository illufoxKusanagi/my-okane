import { db } from '~~/server/db'
import { categories } from '~~/server/db/schema'
import { validateUpdateCategory } from '~~/server/utils/validator'
import { and, eq } from 'drizzle-orm'
import { throwSafeServerError } from '~~/server/utils/safeError'

export default defineEventHandler(async (event) => {
  const idStr = event.context.params?.id
  if (!idStr) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Category ID is required'
    })
  }

  const id = parseInt(idStr, 10)
  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid Category ID'
    })
  }

  const body = await readBody(event)
  const validation = validateUpdateCategory(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: validation.error.issues
    })
  }

  try {
    const userId = await getAuthUserId(event)

    // Renaming to a name that already exists would merge two categories
    // in name-based groupings (charts, lookups).
    if (validation.data.name !== undefined) {
      const duplicate = await db
        .select({ id: categories.id })
        .from(categories)
        .where(
          and(
            eq(categories.userId, userId),
            eq(categories.name, validation.data.name)
          )
        )
        .limit(1)
      if (duplicate[0] && duplicate[0].id !== id) {
        throw createError({
          statusCode: 409,
          statusMessage: 'A category with this name already exists.'
        })
      }
    }

    const updatedCategory = await db
      .update(categories)
      .set({
        name: validation.data.name,
        type: validation.data.type,
        icon: validation.data.icon,
        color: validation.data.color
      })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning()

    if (updatedCategory.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Category not found'
      })
    }

    return {
      success: true,
      data: updatedCategory[0]
    }
  } catch (error: unknown) {
    throwSafeServerError(error, {
      context: 'update category',
      fallbackMessage: 'Failed to update category',
      conflictMessage: 'A category with this name already exists.'
    })
  }
})
