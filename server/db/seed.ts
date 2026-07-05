import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { categories, transactions, users } from "./schema";
import { hashUserPassword } from "../utils/password";

const url = process.env.TURSO_DATABASE_URL || "";
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url,
  authToken,
});

const db = drizzle({ client });

async function main() {
  console.log("Seeding database...");

  // 1. Clear existing transactions, categories, and users
  console.log("Clearing existing data...");
  await db.delete(transactions);
  await db.delete(categories);
  await db.delete(users);

  // 2. Create default user
  console.log("Creating default user...");
  const passwordHash = hashUserPassword("defaultpassword123");
  const userResult = await db.insert(users).values({
    name: "Default User",
    email: "default@myokane.com",
    passwordHash,
  }).returning();
  const defaultUser = userResult[0];
  if (!defaultUser) {
    throw new Error("Failed to create default user");
  }
  const defaultUserId = defaultUser.id;

  const initialCategories = [
    // Spending Categories
    { name: "Food", type: "spending", icon: "i-lucide-utensils", color: "amber", userId: defaultUserId },
    { name: "Transport", type: "spending", icon: "i-lucide-car", color: "blue", userId: defaultUserId },
    { name: "Utilities", type: "spending", icon: "i-lucide-lightbulb", color: "yellow", userId: defaultUserId },
    { name: "Entertainment", type: "spending", icon: "i-lucide-film", color: "purple", userId: defaultUserId },
    { name: "Shopping", type: "spending", icon: "i-lucide-shopping-bag", color: "pink", userId: defaultUserId },
    { name: "Others", type: "spending", icon: "i-lucide-circle-help", color: "slate", userId: defaultUserId },

    // Income Categories
    { name: "Salary", type: "income", icon: "i-lucide-wallet", color: "emerald", userId: defaultUserId },
    { name: "Freelance", type: "income", icon: "i-lucide-briefcase", color: "cyan", userId: defaultUserId },
    { name: "Investments", type: "income", icon: "i-lucide-trending-up", color: "indigo", userId: defaultUserId },
    { name: "Others", type: "income", icon: "i-lucide-circle-help", color: "slate", userId: defaultUserId },
  ];

  // 3. Insert categories and get the returned list with IDs
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

  // 4. Define initial mock transactions
  const initialTransactions = [
    // June 2026 Transactions
    {
      name: "Monthly Salary",
      type: "income",
      amount: 15000000,
      notes: "June payroll",
      transactionDate: new Date("2026-06-01T08:00:00Z"),
      categoryId: getCatId("Salary", "income"),
      userId: defaultUserId,
    },
    {
      name: "Office Lunch",
      type: "spending",
      amount: 75000,
      notes: "Nasi padang",
      transactionDate: new Date("2026-06-02T12:30:00Z"),
      categoryId: getCatId("Food", "spending"),
      userId: defaultUserId,
    },
    {
      name: "Weekly Gasoline",
      type: "spending",
      amount: 150000,
      notes: "Full tank",
      transactionDate: new Date("2026-06-03T18:00:00Z"),
      categoryId: getCatId("Transport", "spending"),
      userId: defaultUserId,
    },
    {
      name: "Electricity & Water",
      type: "spending",
      amount: 850000,
      notes: "Utilities bill",
      transactionDate: new Date("2026-06-05T09:00:00Z"),
      categoryId: getCatId("Utilities", "spending"),
      userId: defaultUserId,
    },
    {
      name: "Weekend Cinema",
      type: "spending",
      amount: 120000,
      notes: "2 tickets + popcorn",
      transactionDate: new Date("2026-06-10T19:30:00Z"),
      categoryId: getCatId("Entertainment", "spending"),
      userId: defaultUserId,
    },
    {
      name: "Freelance Landing Page",
      type: "income",
      amount: 4500000,
      notes: "Payment from client A",
      transactionDate: new Date("2026-06-15T10:00:00Z"),
      categoryId: getCatId("Freelance", "income"),
      userId: defaultUserId,
    },
    {
      name: "Grocery Shopping",
      type: "spending",
      amount: 450000,
      notes: "Monthly stock",
      transactionDate: new Date("2026-06-18T15:00:00Z"),
      categoryId: getCatId("Shopping", "spending"),
      userId: defaultUserId,
    },
    {
      name: "Cafe Coffee",
      type: "spending",
      amount: 65000,
      notes: "Starbucks meeting",
      transactionDate: new Date("2026-06-20T14:00:00Z"),
      categoryId: getCatId("Food", "spending"),
      userId: defaultUserId,
    },
    {
      name: "Grab Car Ride",
      type: "spending",
      amount: 50000,
      notes: "To office",
      transactionDate: new Date("2026-06-25T08:30:00Z"),
      categoryId: getCatId("Transport", "spending"),
      userId: defaultUserId,
    },

    // July 2026 Transactions
    {
      name: "Monthly Salary",
      type: "income",
      amount: 15000000,
      notes: "July payroll",
      transactionDate: new Date("2026-07-01T08:00:00Z"),
      categoryId: getCatId("Salary", "income"),
      userId: defaultUserId,
    },
    {
      name: "Netflix Subscription",
      type: "spending",
      amount: 186000,
      notes: "Premium plan",
      transactionDate: new Date("2026-07-01T10:00:00Z"),
      categoryId: getCatId("Entertainment", "spending"),
      userId: defaultUserId,
    },
    {
      name: "Team Dinner",
      type: "spending",
      amount: 250000,
      notes: "Shared cost",
      transactionDate: new Date("2026-07-02T19:00:00Z"),
      categoryId: getCatId("Food", "spending"),
      userId: defaultUserId,
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
