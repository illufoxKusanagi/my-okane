import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config();

export default defineConfig({
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations/turso",
  dialect: "turso",
  dbCredentials: {
    url:
      // process.env.TURSO_DATABASE_URL! ||
      "postgresql://myokane:myokane@localhost:5432/myokane_db",
    // authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
