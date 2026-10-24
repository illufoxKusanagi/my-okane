import type { H3Event } from 'h3'

export async function getAuthUserId(event: H3Event): Promise<string> {
  const session = await requireUserSession(event)
  if (!session || !session.user || typeof session.user.id !== 'string') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Invalid or missing session credentials.'
    })
  }
  return session.user.id
}
