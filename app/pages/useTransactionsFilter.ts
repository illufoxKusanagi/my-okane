import { ref, computed, watch } from "vue";
import type { Ref } from "vue";
import type { Transaction } from "~/composables/useFinance";

export function useTransactionsFilter(transactions: Ref<Transaction[]>) {
  const searchQuery = ref("");
  const selectedType = ref<"all" | "income" | "spending">("all");
  const selectedCategoryId = ref<string | "all">("all");
  const currentPage = ref(1);
  const pageSize = ref(15);

  const hasActiveFilters = computed(() => {
    return (
      searchQuery.value.trim() !== "" ||
      selectedType.value !== "all" ||
      selectedCategoryId.value !== "all"
    );
  });

  const resetFilters = () => {
    searchQuery.value = "";
    selectedType.value = "all";
    selectedCategoryId.value = "all";
    currentPage.value = 1;
  };

  // Reset to page 1 whenever any filter condition changes
  watch([searchQuery, selectedType, selectedCategoryId], () => {
    currentPage.value = 1;
  });

  const filteredTransactions = computed(() => {
    return transactions.value.filter((t) => {
      const matchesSearch = t.name
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase());
      const matchesType =
        selectedType.value === "all" || t.type === selectedType.value;
      const matchesCategory =
        selectedCategoryId.value === "all" ||
        t.categoryId === selectedCategoryId.value;
      return matchesSearch && matchesType && matchesCategory;
    });
  });

  const paginatedTransactions = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredTransactions.value.slice(start, start + pageSize.value);
  });

  return {
    searchQuery,
    selectedType,
    selectedCategoryId,
    currentPage,
    pageSize,
    hasActiveFilters,
    resetFilters,
    filteredTransactions,
    paginatedTransactions,
  };
}
