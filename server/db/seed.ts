import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { categories } from "./schema";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://myokane:myokane@localhost:5432/myokane_db";
const client = postgres(connectionString);
const db = drizzle(client);

async function main() {
  console.log("Seeding database...");

  const initialCategories = [
    // Spending Categories
    { name: "Food", type: "spending", icon: "i-lucide-utensils", color: "amber" },
    { name: "Transport", type: "spending", icon: "i-lucide-car", color: "blue" },
    { name: "Utilities", type: "spending", icon: "i-lucide-lightbulb", color: "yellow" },
    { name: "Entertainment", type: "spending", icon: "i-lucide-film", color: "purple" },
    { name: "Shopping", type: "spending", icon: "i-lucide-shopping-bag", color: "pink" },
    { name: "Others", type: "spending", icon: "i-lucide-circle-help", color: "slate" },

    // Income Categories
    { name: "Salary", type: "income", icon: "i-lucide-wallet", color: "emerald" },
    { name: "Freelance", type: "income", icon: "i-lucide-briefcase", color: "cyan" },
    { name: "Investments", type: "income", icon: "i-lucide-trending-up", color: "indigo" },
    { name: "Others", type: "income", icon: "i-lucide-circle-help", color: "slate" },
  ];

  for (const cat of initialCategories) {
    await db.insert(categories).values(cat);
  }

  console.log("Database seeded successfully!");
  await client.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Seeding failed:", err);
  await client.end();
  process.exit(1);
});
