import { categories } from "hub:db:schema";
import { db } from "hub:db";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const type = query.type as string | undefined;

  if (type === "income" || type === "spending") {
    const list = await db
      .select()
      .from(categories)
      .where(eq(categories.type, type));
    return list;
  }

  const list = await db.select().from(categories);
  return list;
});
