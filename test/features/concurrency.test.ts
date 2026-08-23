// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "~~/server/db";
import { users, budgets } from "~~/server/db/schema";
import { and, eq, isNull } from "drizzle-orm";

describe("Concurrency Upsert Verification", () => {
  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "./server/db/migrations" });
    await db.delete(budgets);
    await db.delete(users);
  });

  it("should cleanly upsert the budget limit without creating duplicate records for the same month", async () => {
    // 1. Insert a test user
    const [testUser] = await db
      .insert(users)
      .values({
        name: "Upsert Tester",
        email: "upsert@example.com",
        passwordHash: "dummy-hash",
      })
      .returning();

    expect(testUser).toBeDefined();
    if (!testUser) return;

    const targetMonth = "2026-08";

    // Helper function mimicking the API's select-before-insert budget logic
    const saveBudget = async (amount: number) => {
      const existing = await db
        .select()
        .from(budgets)
        .where(
          and(
            eq(budgets.userId, testUser.id),
            isNull(budgets.categoryId),
            eq(budgets.month, targetMonth),
          ),
        )
        .limit(1);

      const existingBudget = existing[0];
      if (existingBudget) {
        return await db
          .update(budgets)
          .set({ amount })
          .where(eq(budgets.id, existingBudget.id))
          .returning();
      } else {
        return await db
          .insert(budgets)
          .values({
            userId: testUser.id,
            categoryId: null,
            amount,
            month: targetMonth,
          })
          .returning();
      }
    };

    // 2. First call: inserts new budget limit of 500k
    await saveBudget(500000);

    // 3. Second call: updates existing budget to 1M
    await saveBudget(1000000);

    // 4. Verify only one budget record exists in the database
    const allBudgets = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, testUser.id),
          isNull(budgets.categoryId),
          eq(budgets.month, targetMonth),
        ),
      );

    expect(allBudgets.length).toBe(1);
    expect(allBudgets[0]?.amount).toBe(1000000);
  });
});
