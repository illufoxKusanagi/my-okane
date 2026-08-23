import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

const isDev = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

const defaultLocalDb = isTest ? "file:local.test.db" : isDev ? "file:local.dev.db" : "file:local.db";
const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || defaultLocalDb;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url,
  authToken,
});

export const db = drizzle({ client });
