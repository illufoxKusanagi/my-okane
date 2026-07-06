import { db } from "~~/server/db";
import { users, categories } from "~~/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as Sentry from "@sentry/nuxt";

import { checkRateLimit } from "~~/server/utils/rateLimiter";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default defineEventHandler(async (event) => {
  checkRateLimit(event, {
    uniqueKey: "auth_register",
    windowMs: 60 * 60 * 1000,
    limit: 3,
    message: "Too many registration attempts from this IP.",
  });

  const body = await readBody(event);

  const validation = registerSchema.safeParse(body);
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.issues[0]?.message || "Validation failed",
    });
  }

  const { name, email, password } = validation.data;

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: "Email address is already registered",
      });
    }

    const passwordHash = hashUserPassword(password);

    const userResult = await db
      .insert(users)
      .values({
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
      })
      .returning();

    const newUser = userResult[0];
    if (!newUser) {
      throw createError({
        statusCode: 500,
        statusMessage: "Registration failed: User could not be created",
      });
    }

    const defaultCategories = [
      {
        name: "Food",
        type: "spending",
        icon: "i-lucide-utensils",
        color: "amber",
        userId: newUser.id,
      },
      {
        name: "Transport",
        type: "spending",
        icon: "i-lucide-car",
        color: "blue",
        userId: newUser.id,
      },
      {
        name: "Utilities",
        type: "spending",
        icon: "i-lucide-lightbulb",
        color: "yellow",
        userId: newUser.id,
      },
      {
        name: "Entertainment",
        type: "spending",
        icon: "i-lucide-film",
        color: "purple",
        userId: newUser.id,
      },
      {
        name: "Shopping",
        type: "spending",
        icon: "i-lucide-shopping-bag",
        color: "pink",
        userId: newUser.id,
      },
      {
        name: "Others",
        type: "spending",
        icon: "i-lucide-circle-help",
        color: "slate",
        userId: newUser.id,
      },
      {
        name: "Salary",
        type: "income",
        icon: "i-lucide-wallet",
        color: "emerald",
        userId: newUser.id,
      },
      {
        name: "Freelance",
        type: "income",
        icon: "i-lucide-briefcase",
        color: "cyan",
        userId: newUser.id,
      },
      {
        name: "Investments",
        type: "income",
        icon: "i-lucide-trending-up",
        color: "indigo",
        userId: newUser.id,
      },
      {
        name: "Others",
        type: "income",
        icon: "i-lucide-circle-help",
        color: "slate",
        userId: newUser.id,
      },
    ];

    await db.insert(categories).values(defaultCategories);

    await setUserSession(event, {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });

    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    };
  } catch (error: any) {
    console.error("Registration error:", error);
    Sentry.captureException(error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Registration failed",
      data: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
  }
});
