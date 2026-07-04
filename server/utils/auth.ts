import { type H3Event } from "h3";

/**
 * Extracts and returns the authenticated user's ID from the current session.
 * Throws a 401 Unauthorized error if the session or user ID is missing.
 */
export async function getAuthUserId(event: H3Event): Promise<number> {
  const session = await requireUserSession(event);
  if (!session || !session.user || typeof session.user.id !== "number") {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: Invalid or missing session credentials.",
    });
  }
  return session.user.id;
}
