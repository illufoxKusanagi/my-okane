import { categories } from "~~/server/db/schema";
import { db } from "~~/server/db";
import { and, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const type = query.type as string | undefined;
  const userId = await getAuthUserId(event);

  if (type === "income" || type === "spending") {
    const list = await db
      .select()
      .from(categories)
      .where(and(eq(categories.type, type), eq(categories.userId, userId)));
    return list;
  }

  const list = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId));
  return list;
});
