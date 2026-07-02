import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { categories, transactions } from "./schema";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url,
  authToken,
});

const db = drizzle({ client });

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

  // 1. Clear existing transactions and categories
  console.log("Clearing existing data...");
  await db.delete(transactions);
  await db.delete(categories);

  // 2. Insert categories and get the returned list with IDs
  console.log("Inserting categories...");
  const insertedCats = await db.insert(categories).values(initialCategories).returning();

  // Create a map of "Name:Type" -> ID
  const catMap = new Map<string, number>();
  for (const cat of insertedCats) {
    catMap.set(`${cat.name}:${cat.type}`, cat.id);
  }

  // Helper helper to get Category ID
  const getCatId = (name: string, type: string): number => {
    const id = catMap.get(`${name}:${type}`);
    if (id === undefined) {
      throw new Error(`Category not found: ${name} (${type})`);
    }
    return id;
  };

  // 3. Define initial mock transactions
  const initialTransactions = [
    // June 2026 Transactions
    {
      name: "Monthly Salary",
      type: "income",
      amount: 15000000,
      notes: "June payroll",
      transactionDate: new Date("2026-06-01T08:00:00Z"),
      categoryId: getCatId("Salary", "income"),
    },
    {
      name: "Office Lunch",
      type: "spending",
      amount: 75000,
      notes: "Nasi padang",
      transactionDate: new Date("2026-06-02T12:30:00Z"),
      categoryId: getCatId("Food", "spending"),
    },
    {
      name: "Weekly Gasoline",
      type: "spending",
      amount: 150000,
      notes: "Full tank",
      transactionDate: new Date("2026-06-03T18:00:00Z"),
      categoryId: getCatId("Transport", "spending"),
    },
    {
      name: "Electricity & Water",
      type: "spending",
      amount: 850000,
      notes: "Utilities bill",
      transactionDate: new Date("2026-06-05T09:00:00Z"),
      categoryId: getCatId("Utilities", "spending"),
    },
    {
      name: "Weekend Cinema",
      type: "spending",
      amount: 120000,
      notes: "2 tickets + popcorn",
      transactionDate: new Date("2026-06-10T19:30:00Z"),
      categoryId: getCatId("Entertainment", "spending"),
    },
    {
      name: "Freelance Landing Page",
      type: "income",
      amount: 4500000,
      notes: "Payment from client A",
      transactionDate: new Date("2026-06-15T10:00:00Z"),
      categoryId: getCatId("Freelance", "income"),
    },
    {
      name: "Grocery Shopping",
      type: "spending",
      amount: 450000,
      notes: "Monthly stock",
      transactionDate: new Date("2026-06-18T15:00:00Z"),
      categoryId: getCatId("Shopping", "spending"),
    },
    {
      name: "Cafe Coffee",
      type: "spending",
      amount: 65000,
      notes: "Starbucks meeting",
      transactionDate: new Date("2026-06-20T14:00:00Z"),
      categoryId: getCatId("Food", "spending"),
    },
    {
      name: "Grab Car Ride",
      type: "spending",
      amount: 50000,
      notes: "To office",
      transactionDate: new Date("2026-06-25T08:30:00Z"),
      categoryId: getCatId("Transport", "spending"),
    },

    // July 2026 Transactions
    {
      name: "Monthly Salary",
      type: "income",
      amount: 15000000,
      notes: "July payroll",
      transactionDate: new Date("2026-07-01T08:00:00Z"),
      categoryId: getCatId("Salary", "income"),
    },
    {
      name: "Netflix Subscription",
      type: "spending",
      amount: 186000,
      notes: "Premium plan",
      transactionDate: new Date("2026-07-01T10:00:00Z"),
      categoryId: getCatId("Entertainment", "spending"),
    },
    {
      name: "Team Dinner",
      type: "spending",
      amount: 250000,
      notes: "Shared cost",
      transactionDate: new Date("2026-07-02T19:00:00Z"),
      categoryId: getCatId("Food", "spending"),
    },
  ];

  console.log("Inserting transactions...");
  await db.insert(transactions).values(initialTransactions);

  console.log("Database seeded successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
