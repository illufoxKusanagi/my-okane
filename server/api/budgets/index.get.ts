import { budgets, categories, transactions } from "~~/server/db/schema";
import { db } from "~~/server/db";
import { and, eq, isNull, sql } from "drizzle-orm";
import * as Sentry from "@sentry/nuxt";

export default defineEventHandler(async (event) => {
  try {
    const userId = await getAuthUserId(event);
    const query = getQuery(event);

    const month =
      (query.month as string) || new Date().toISOString().slice(0, 7);

    const globalBudgetResult = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          isNull(budgets.categoryId),
          eq(budgets.month, month),
        ),
      )
      .limit(1);

    const globalBudget = globalBudgetResult[0] || null;

    const totalSpendingResult = await db
      .select({ total: sql<number>`sum(${transactions.amount})` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "spending"),
          sql`strftime('%Y-%m', datetime(${transactions.transactionDate}, 'unixepoch')) = ${month}`,
        ),
      );
    const totalSpending = Number(totalSpendingResult[0]?.total || 0);

    const totalIncomeResult = await db
      .select({ total: sql<number>`sum(${transactions.amount})` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "income"),
          sql`strftime('%Y-%m', datetime(${transactions.transactionDate}, 'unixepoch')) = ${month}`,
        ),
      );
    const totalIncome = Number(totalIncomeResult[0]?.total || 0);

    const allCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));

    const categoryBudgets = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.month, month),
          sql`${budgets.categoryId} is not null`,
        ),
      );

    const categoryTransactions = await db
      .select({
        categoryId: transactions.categoryId,
        total: sql<number>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          sql`strftime('%Y-%m', datetime(${transactions.transactionDate}, 'unixepoch')) = ${month}`,
        ),
      )
      .groupBy(transactions.categoryId);

    const budgetMap = new Map(categoryBudgets.map((b) => [b.categoryId, b]));
    const transactionMap = new Map(
      categoryTransactions.map((t) => [t.categoryId, Number(t.total || 0)]),
    );

    const pockets = allCategories.map((cat) => {
      const budget = budgetMap.get(cat.id);
      const spentOrIncome = transactionMap.get(cat.id) || 0;
      const budgetAmount = budget ? budget.amount : 0;
      return {
        ...cat,
        budgetId: budget ? budget.id : null,
        budgetAmount,
        spent: cat.type === "spending" ? spentOrIncome : 0,
        earned: cat.type === "income" ? spentOrIncome : 0,
        remaining:
          cat.type === "spending"
            ? Math.max(0, budgetAmount - spentOrIncome)
            : 0,
      };
    });

    return {
      month,
      globalBudget: globalBudget
        ? {
            id: globalBudget.id,
            amount: globalBudget.amount,
            spent: totalSpending,
            remaining: Math.max(0, globalBudget.amount - totalSpending),
          }
        : null,
      totalIncome,
      totalSpending,
      balance: totalIncome - totalSpending,
      pockets,
    };
  } catch (error: any) {
    console.error("Fetch budgets error:", error);
    Sentry.captureException(error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch budgets",
      data: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
  }
});
