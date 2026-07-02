import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations/postgresql",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://myokane:myokane@localhost:5432/myokane_db",
  },
});
