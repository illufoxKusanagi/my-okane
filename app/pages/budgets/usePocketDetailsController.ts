import { ref, computed } from "vue";
import type { Transaction } from "~/composables/useFinance";

export function usePocketDetailsController(categoryId: string) {
  // Local-time month string; toISOString() would use UTC month.
  const now = new Date();
  const currentMonth = ref(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );

  const {
    data: budgetData,
    status,
    refresh,
  } = useFetch("/api/budgets", {
    query: { month: currentMonth },
  });

  const pending = computed(() => status.value === "pending");

  const { transactions, addTransaction, deleteTransaction, updateTransaction } =
    useFinance();

  const pocket = computed(() => {
    if (!budgetData.value) return null;
    return budgetData.value.pockets.find((p) => p.id === categoryId) || null;
  });

  const pocketTransactions = computed(() => {
    return transactions.value.filter((t) => {
      if (t.categoryId !== categoryId) return false;

      const tDate = new Date(t.transactionDate);
      const yyyymm = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, "0")}`;
      return yyyymm === currentMonth.value;
    });
  });

  const pocketNumber = computed(() => {
    const prefix = "5059";
    const mid = categoryId
      .replace(/[^0-9a-zA-Z]/g, "")
      .slice(-4)
      .toUpperCase()
      .padStart(4, "0");
    const suffix = "8711";
    return `${prefix} ${mid} ${suffix}`;
  });

  const isBudgetModalOpen = ref(false);
  const budgetAmount = ref<number | null>(null);

  const isTxModalOpen = ref(false);
  const txName = ref("");
  const txAmount = ref(0);
  const txNotes = ref("");
  const txDate = ref("");
  const editingTx = ref<Transaction | null>(null);

  const isDeleteConfirmOpen = ref(false);
  const txToDelete = ref<Transaction | null>(null);

  const openBudgetModal = () => {
    budgetAmount.value = pocket.value?.budgetAmount || null;
    isBudgetModalOpen.value = true;
  };

  const handleSaveBudget = async () => {
    try {
      await $fetch("/api/budgets", {
        method: "POST",
        body: {
          categoryId,
          amount: budgetAmount.value || 0,
          month: currentMonth.value,
        },
      });
      isBudgetModalOpen.value = false;
      refresh();
    } catch (error) {
      console.error("Failed to save budget:", error);
    }
  };

  const handleDeleteBudget = async () => {
    if (!pocket.value?.budgetId) return;
    try {
      await $fetch(`/api/budgets/${pocket.value.budgetId}`, {
        method: "DELETE",
      });
      refresh();
    } catch (error) {
      console.error("Failed to delete budget:", error);
    }
  };

  const openTxModal = (tx?: Transaction) => {
    const { toDateInputValue } = useFormatters();
    if (tx) {
      editingTx.value = tx;
      txName.value = tx.name;
      txAmount.value = tx.amount;
      txNotes.value = tx.notes || "";
      txDate.value = toDateInputValue(tx.transactionDate);
    } else {
      editingTx.value = null;
      txName.value = "";
      txAmount.value = 0;
      txNotes.value = "";
      txDate.value = toDateInputValue(new Date());
    }
    isTxModalOpen.value = true;
  };

  const handleSaveTransaction = async () => {
    if (
      !txName.value.trim() ||
      !(txAmount.value > 0) ||
      !txDate.value ||
      !pocket.value
    ) {
      return;
    }

    const type = pocket.value.type === "income" ? "income" : "spending";
    try {
      if (editingTx.value) {
        await updateTransaction(
          editingTx.value.id,
          txName.value,
          categoryId,
          txAmount.value,
          type,
          txNotes.value,
          txDate.value,
        );
      } else {
        await addTransaction(
          txName.value,
          categoryId,
          txAmount.value,
          type,
          txNotes.value,
          txDate.value,
        );
      }
      isTxModalOpen.value = false;
      refresh();
    } catch (error) {
      console.error("Failed to save transaction:", error);
    }
  };

  const confirmDeleteTx = (tx: Transaction) => {
    txToDelete.value = tx;
    isDeleteConfirmOpen.value = true;
  };

  const handleDeleteConfirm = async () => {
    if (!txToDelete.value) return;
    try {
      await deleteTransaction(txToDelete.value.id);
      refresh();
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    } finally {
      isDeleteConfirmOpen.value = false;
      txToDelete.value = null;
    }
  };

  return {
    currentMonth,
    pocket,
    pocketTransactions,
    pocketNumber,
    status,
    pending,
    isBudgetModalOpen,
    budgetAmount,
    isTxModalOpen,
    txName,
    txAmount,
    txNotes,
    txDate,
    editingTx,
    isDeleteConfirmOpen,
    txToDelete,
    openBudgetModal,
    handleSaveBudget,
    handleDeleteBudget,
    openTxModal,
    handleSaveTransaction,
    confirmDeleteTx,
    handleDeleteConfirm,
  };
}
