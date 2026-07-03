import { ref, computed } from "vue";
import * as Sentry from "@sentry/nuxt";

export interface Transaction {
  id: number;
  name: string;
  type: "income" | "spending";
  amount: number;
  notes?: string | null;
  transactionDate: string | Date;
  categoryId: number;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  createdAt: string | Date;
}

export interface Category {
  id: number;
  name: string;
  type: "income" | "spending";
  icon?: string | null;
  color?: string | null;
}

export interface CategoryData {
  label: string;
  value: number;
  color: string;
}

// Global shared state to avoid multiple requests across components
const transactions = ref<Transaction[]>([]);
const categories = ref<Category[]>([]);
const isInitialized = ref(false);

export function useFinance() {
  const fetchAll = async () => {
    try {
      const [txData, catData] = await Promise.all([
        $fetch<Transaction[]>("/api/transactions"),
        $fetch<Category[]>("/api/categories"),
      ]);
      transactions.value = txData;
      categories.value = catData;
      isInitialized.value = true;
    } catch (error) {
      console.error("Failed to fetch finance data:", error);
      Sentry.captureException(error);
    }
  };

  // Automatically initialize if not done yet
  if (!isInitialized.value && import.meta.client) {
    fetchAll();
  }

  const addTransaction = async (
    name: string,
    categoryId: number,
    amount: number,
    type: "income" | "spending",
    notes?: string | null,
    date?: string | Date
  ) => {
    try {
      const res = await $fetch<{ success: boolean; data: Transaction }>("/api/transactions", {
        method: "POST",
        body: {
          name,
          categoryId,
          amount,
          type,
          notes,
          transactionDate: date,
        },
      });
      if (res.success) {
        // Refresh all data to ensure summary/categories/txs are updated and joined correctly
        await fetchAll();
      }
    } catch (error) {
      console.error("Failed to add transaction:", error);
      Sentry.captureException(error);
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      const res = await $fetch<{ success: boolean }>((`/api/transactions/${id}`), {
        method: "DELETE",
      });
      if (res.success) {
        await fetchAll();
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      Sentry.captureException(error);
    }
  };

  const addCategory = async (name: string, type: "income" | "spending", icon?: string, color?: string) => {
    try {
      const res = await $fetch<{ success: boolean; data: Category }>("/api/categories", {
        method: "POST",
        body: { name, type, icon, color },
      });
      if (res.success) {
        await fetchAll();
      }
    } catch (error) {
      console.error("Failed to add category:", error);
      Sentry.captureException(error);
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      const res = await $fetch<{ success: boolean }>((`/api/categories/${id}`), {
        method: "DELETE",
      });
      if (res.success) {
        await fetchAll();
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      Sentry.captureException(error);
    }
  };

  const updateCategory = async (id: number, name: string, type: "income" | "spending", icon?: string, color?: string) => {
    try {
      const res = await $fetch<{ success: boolean }>((`/api/categories/${id}`), {
        method: "PUT",
        body: { name, type, icon, color },
      });
      if (res.success) {
        await fetchAll();
      }
    } catch (error) {
      console.error("Failed to update category:", error);
      Sentry.captureException(error);
    }
  };

  const getCategories = (type?: "income" | "spending") => {
    if (type === "income") return categories.value.filter((c) => c.type === "income");
    if (type === "spending") return categories.value.filter((c) => c.type === "spending");
    return categories.value;
  };

  // Helper colors for charts/UI if not defined in category
  const colors = [
    "hsl(220 70% 50%)",
    "hsl(160 60% 45%)",
    "hsl(30 80% 55%)",
    "hsl(280 65% 55%)",
    "hsl(0 65% 55%)",
    "hsl(45 95% 50%)",
    "hsl(200 80% 50%)",
    "hsl(340 80% 55%)",
  ];

  const getSpendingByCategory = (): CategoryData[] => {
    const categoryMap = new Map<string, { value: number; color: string }>();

    transactions.value
      .filter((t) => t.type === "spending")
      .forEach((t) => {
        const catName = t.categoryName || "Uncategorized";
        const catColor = (t.categoryColor || colors[categoryMap.size % colors.length]) as string;
        const existing = categoryMap.get(catName) || { value: 0, color: catColor };
        categoryMap.set(catName, {
          value: existing.value + t.amount,
          color: existing.color,
        });
      });

    return Array.from(categoryMap.entries()).map(([label, data]) => ({
      label,
      value: data.value,
      color: data.color,
    }));
  };

  const getIncomeByCategory = (): CategoryData[] => {
    const categoryMap = new Map<string, { value: number; color: string }>();

    transactions.value
      .filter((t) => t.type === "income")
      .forEach((t) => {
        const catName = t.categoryName || "Uncategorized";
        const catColor = (t.categoryColor || colors[categoryMap.size % colors.length]) as string;
        const existing = categoryMap.get(catName) || { value: 0, color: catColor };
        categoryMap.set(catName, {
          value: existing.value + t.amount,
          color: existing.color,
        });
      });

    return Array.from(categoryMap.entries()).map(([label, data]) => ({
      label,
      value: data.value,
      color: data.color,
    }));
  };

  const getTotalSpending = () =>
    transactions.value
      .filter((t) => t.type === "spending")
      .reduce((sum, t) => sum + t.amount, 0);

  const getTotalIncome = () =>
    transactions.value
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

  const getTransactionsByCategory = (categoryName: string) =>
    transactions.value.filter((t) => t.categoryName === categoryName);

  return {
    transactions,
    categories,
    isInitialized,
    fetchAll,
    addTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategories,
    getSpendingByCategory,
    getIncomeByCategory,
    getTotalSpending,
    getTotalIncome,
    getTransactionsByCategory,
  };
}
