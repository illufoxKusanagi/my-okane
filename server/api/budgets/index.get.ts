import { budgets, categories, transactions } from "~~/server/db/schema";
import { db } from "~~/server/db";
import { and, eq, isNull, sql } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const userId = await getAuthUserId(event);
  const query = getQuery(event);
  
  // Default to current month YYYY-MM
  const month = (query.month as string) || new Date().toISOString().slice(0, 7);

  // 1. Fetch Global Budget for the month
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

  // 2. Calculate total spending for the month
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

  // 3. Calculate total income for the month
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

  // 4. Fetch all categories of this user
  const allCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId));

  // 5. Fetch all category budgets for this month
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

  // 6. Fetch spent/income amounts per category for this month
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

  // 7. Build Map lookups
  const budgetMap = new Map(categoryBudgets.map((b) => [b.categoryId, b]));
  const transactionMap = new Map(
    categoryTransactions.map((t) => [t.categoryId, Number(t.total || 0)]),
  );

  // 8. Map categories into Pockets
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
      remaining: cat.type === "spending" ? Math.max(0, budgetAmount - spentOrIncome) : 0,
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
});
