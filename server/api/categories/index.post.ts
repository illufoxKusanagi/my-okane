import { categories } from '~~/server/db/schema'
import { db } from '~~/server/db'
import { validateCategory } from '~~/server/utils/validator'
import { throwSafeServerError } from '~~/server/utils/safeError'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validation = validateCategory(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Failed',
      data: validation.error!.issues
    })
  }
  try {
    const userId = await getAuthUserId(event)
    const newCategory = await db
      .insert(categories)
      .values({
        name: validation.data.name,
        type: validation.data.type,
        icon: validation.data.icon,
        color: validation.data.color,
        userId: userId
      })
      .returning()
    return { success: true, data: newCategory[0] }
  } catch (error: unknown) {
    throwSafeServerError(error, {
      context: 'create category',
      fallbackMessage: 'Failed to create category',
      conflictMessage: 'A category with this name already exists.'
    })
  }
})
