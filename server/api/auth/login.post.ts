import { db } from "~~/server/db";
import { users } from "~~/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as Sentry from "@sentry/nuxt";

import { checkRateLimit } from "~~/server/utils/rateLimiter";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default defineEventHandler(async (event) => {
  // Apply login rate limit (Max 5 requests per 15 minutes)
  checkRateLimit(event, {
    uniqueKey: "auth_login",
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: "Too many login attempts from this IP.",
  });

  const body = await readBody(event);

  const validation = loginSchema.safeParse(body);
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.issues[0]?.message || "Validation failed",
    });
  }

  const { email, password } = validation.data;

  try {
    // 1. Fetch user
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    const user = userResult[0];
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid email or password",
      });
    }

    const match = verifyUserPassword(password, user.passwordHash);
    if (!match) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid email or password",
      });
    }

    // 3. Establish session
    await setUserSession(event, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  } catch (error: any) {
    console.error("Login error:", error);
    Sentry.captureException(error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Login failed",
      data: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
  }
});
