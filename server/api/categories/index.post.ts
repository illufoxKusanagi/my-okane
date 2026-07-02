import { categories } from "hub:db:schema";
import { db } from "hub:db";
import { validateCategory } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const validation = validateCategory(body);
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation Failed",
      data: validation.error!.issues,
    });
  }
  const newCategory = await db
    .insert(categories)
    .values({
      name: validation.data.name,
      type: validation.data.type,
      icon: validation.data.icon,
      color: validation.data.color,
    })
    .returning();
  return { success: true, data: newCategory[0] };
});
