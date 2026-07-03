<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { Transaction } from "~/composables/useFinance";
import { useReceiptScan } from "~/composables/useReceiptScan";
import * as Sentry from "@sentry/nuxt";

const {
  transactions,
  categories,
  addTransaction,
  deleteTransaction,
  getCategories,
} = useFinance();

const { isScanning, scanError, scan } = useReceiptScan();
const fileInput = ref<HTMLInputElement | null>(null);

const isMobile = ref(false);
onMounted(() => {
  isMobile.value = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
});

const triggerFileSelect = () => {
  fileInput.value?.click();
};

const onFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    const result = await scan(file);
    if (result) {
      editingTransaction.value = null;
      txName.value =
        result.suggestedTransactionName || result.storeName || "Receipt Scan";
      txAmount.value = result.totalAmount || 0;
      txType.value = "spending";
      txNotes.value =
        `Scanned from receipt at ${result.storeName || "Unknown Merchant"}.\n\nItems:\n` +
        result.items
          .map(
            (item) =>
              `- ${item.name}: Rp. ${item.price.toLocaleString("id-ID")}`,
          )
          .join("\n");

      const matchedCat = categories.value.find(
        (c) =>
          c.name.toLowerCase() === result.suggestedCategory.toLowerCase() &&
          c.type === "spending",
      );
      if (matchedCat) {
        txCategoryId.value = matchedCat.id;
      } else {
        const cats = getCategories("spending");
        txCategoryId.value = cats.length > 0 ? cats[0]?.id : undefined;
      }
      isModalOpen.value = true;
    }
  } catch (err: any) {
    alert(err.message || "Failed to scan receipt.");
    Sentry.captureException(err);
  } finally {
    if (fileInput.value) {
      fileInput.value.value = "";
    }
  }
};

// Search and filter state
const searchQuery = ref("");
const selectedType = ref<"all" | "income" | "spending">("all");
const selectedCategoryId = ref<number | "all">("all");

// Edit/Add modal state
const isModalOpen = ref(false);
const editingTransaction = ref<Transaction | null>(null);

// Form state
const txName = ref("");
const txType = ref<"income" | "spending">("spending");
const txAmount = ref(30000);
const txCategoryId = ref<number | undefined>(undefined);
const txNotes = ref("");

// Delete confirmation modal state
const isDeleteConfirmOpen = ref(false);
const transactionToDelete = ref<Transaction | null>(null);

// Filtered categories for the form based on type selection
const formCategories = computed(() => {
  return getCategories(txType.value);
});

// Watch type change in form to set first category
watch(txType, (newType) => {
  const cats = getCategories(newType);
  if (cats.length > 0) {
    txCategoryId.value = cats[0]?.id;
  } else {
    txCategoryId.value = undefined;
  }
});

// Filter transactions based on query, type, and category
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

const openAddModal = () => {
  editingTransaction.value = null;
  txName.value = "";
  txType.value = "spending";
  txAmount.value = 30000;
  txNotes.value = "";
  const cats = getCategories("spending");
  txCategoryId.value = cats.length > 0 ? cats[0]?.id : undefined;
  isModalOpen.value = true;
};

// Open Edit modal (We don't have PUT backend for transaction, but we can do delete then insert, OR we can implement the PUT endpoint if needed! Let's check if PUT endpoint /api/transactions/[id].put.ts is available.)
// Wait, yes, in server/api/transactions/[id].put.ts we have implemented the update transaction endpoint!
// Wait! Let's check useFinance.ts to see if updateTransaction exists. No, let's check. Ah, we didn't add it to useFinance.ts.
// Let's add it directly or do it manually here, or we can use $fetch inside this page. Let's write updateTransaction manually in useFinance.ts later or just use $fetch. Let's define a function here:
const handleSaveTransaction = async () => {
  if (!txName.value.trim() || !txCategoryId.value) return;

  try {
    if (editingTransaction.value) {
      await $fetch(`/api/transactions/${editingTransaction.value.id}`, {
        method: "PUT",
        body: {
          name: txName.value,
          type: txType.value,
          amount: txAmount.value,
          categoryId: txCategoryId.value,
          notes: txNotes.value,
        },
      });
      // Fetch all to refresh
      const { fetchAll } = useFinance();
      await fetchAll();
    } else {
      await addTransaction(
        txName.value,
        txCategoryId.value,
        txAmount.value,
        txType.value,
      );
    }
    isModalOpen.value = false;
  } catch (error) {
    console.error("Failed to save transaction:", error);
    Sentry.captureException(error);
  }
};

const openEditModal = (t: Transaction) => {
  editingTransaction.value = t;
  txName.value = t.name;
  txType.value = t.type;
  txAmount.value = t.amount;
  txCategoryId.value = t.categoryId;
  txNotes.value = t.notes || "";
  isModalOpen.value = true;
};

const confirmDeleteTransaction = (t: Transaction) => {
  transactionToDelete.value = t;
  isDeleteConfirmOpen.value = true;
};

const handleDeleteConfirm = async () => {
  if (transactionToDelete.value) {
    await deleteTransaction(transactionToDelete.value.id);
    isDeleteConfirmOpen.value = false;
    transactionToDelete.value = null;
  }
};

// Date formatter
const formatDate = (dateStr: string | Date) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const colorClassMap: Record<string, string> = {
  amber:
    "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/30",
  blue: "text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/30",
  yellow:
    "text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900/30",
  purple:
    "text-purple-500 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/30",
  pink: "text-pink-500 bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-900/30",
  slate:
    "text-slate-500 bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-900/30",
  emerald:
    "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/30",
  cyan: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-900/30",
  indigo:
    "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/30",
  rose: "text-rose-500 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/30",
};
</script>

<template>
  <div>
    <!-- Hidden file input for OCR scanning -->
    <input
      type="file"
      ref="fileInput"
      accept="image/*"
      class="hidden"
      :capture="isMobile ? 'environment' : undefined"
      @change="onFileSelected"
    />

    <UDashboardGroup>
      <SideSidebar />
      <UDashboardPanel>
        <UDashboardNavbar title="Transactions">
          <template #right>
            <div class="flex items-center gap-2">
              <UButton
                icon="i-lucide-camera"
                color="neutral"
                variant="outline"
                @click="triggerFileSelect"
              >
                <span class="sr-only sm:not-sr-only">Scan Receipt</span>
              </UButton>
              <UButton
                icon="i-lucide-plus"
                color="primary"
                @click="openAddModal"
              >
                <span class="sr-only sm:not-sr-only">Add Transaction</span>
              </UButton>
              <ColorModeButton />
            </div>
          </template>
        </UDashboardNavbar>

        <div class="h-full overflow-auto p-4">
          <UContainer class="py-6 flex flex-col gap-6 w-full">
            <!-- Filters Row -->
            <div
              class="flex flex-col sm:flex-row gap-4 items-center justify-between bg-neutral-50 dark:bg-neutral-900/40 p-4 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50"
            >
              <div class="w-full sm:w-1/3">
                <UInput
                  v-model="searchQuery"
                  icon="i-lucide-search"
                  placeholder="Search transactions..."
                  class="w-full"
                />
              </div>

              <div
                class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center"
              >
                <div class="w-full sm:w-36">
                  <USelect
                    v-model="selectedType"
                    :items="[
                      { label: 'All Types', value: 'all' },
                      { label: 'Income', value: 'income' },
                      { label: 'Spending', value: 'spending' },
                    ]"
                    class="w-full"
                  />
                </div>

                <div class="w-full sm:w-44">
                  <USelect
                    v-model="selectedCategoryId"
                    :items="[
                      { label: 'All Categories', value: 'all' },
                      ...categories.map((c) => ({
                        label: c.name,
                        value: c.id,
                      })),
                    ]"
                    class="w-full"
                  />
                </div>
              </div>
            </div>

            <!-- Transactions List -->
            <div
              v-if="filteredTransactions.length > 0"
              class="flex flex-col gap-3"
            >
              <div
                v-for="tx in filteredTransactions"
                :key="tx.id"
                class="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm hover:shadow-md hover:border-neutral-300/80 dark:hover:border-neutral-700/80 transition-all duration-300 gap-3 sm:gap-4 group"
              >
                <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <!-- Category Icon Badge -->
                  <div
                    :class="[
                      'w-10 h-10 rounded-xl flex items-center justify-center border shrink-0',
                      colorClassMap[tx.categoryColor || 'slate'] ||
                        colorClassMap.slate,
                    ]"
                  >
                    <UIcon
                      :name="tx.categoryIcon || 'i-lucide-folder'"
                      class="w-5 h-5"
                    />
                  </div>

                  <!-- Transaction Info -->
                  <div class="flex-1 min-w-0">
                    <p
                      class="font-bold text-neutral-850 dark:text-neutral-100 truncate text-sm sm:text-base"
                    >
                      {{ tx.name }}
                    </p>
                    <div class="flex items-center gap-2 mt-0.5 sm:mt-1">
                      <span class="text-xs text-neutral-500">
                        {{ formatDate(tx.transactionDate) }}
                      </span>
                      <span
                        class="text-xs text-neutral-300 dark:text-neutral-700"
                        >•</span
                      >
                      <span
                        class="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                      >
                        {{ tx.categoryName || "Uncategorized" }}
                      </span>
                    </div>
                    <p
                      v-if="tx.notes"
                      class="text-xs text-neutral-400 dark:text-neutral-500 mt-1 truncate"
                    >
                      {{ tx.notes }}
                    </p>
                  </div>
                </div>

                <!-- Amount and Actions -->
                <div
                  class="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800/50 pt-2 sm:pt-0"
                >
                  <span
                    :class="[
                      'text-base sm:text-lg font-extrabold tabular-nums',
                      tx.type === 'income'
                        ? 'text-emerald-500'
                        : 'text-rose-500',
                    ]"
                  >
                    {{ tx.type === "income" ? "+" : "-" }} Rp.
                    {{ tx.amount.toLocaleString() }}
                  </span>

                  <div
                    class="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <UButton
                      icon="i-lucide-pencil"
                      size="xs"
                      color="neutral"
                      variant="ghost"
                      @click="openEditModal(tx)"
                    />
                    <UButton
                      icon="i-lucide-trash-2"
                      size="xs"
                      color="error"
                      variant="ghost"
                      @click="confirmDeleteTransaction(tx)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-else
              class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/10"
            >
              <UIcon
                name="i-lucide-arrow-right-left"
                class="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3"
              />
              <p class="font-semibold text-neutral-700 dark:text-neutral-300">
                No transactions found
              </p>
              <p
                class="text-sm text-neutral-500 dark:text-neutral-500 mt-1 mb-4"
              >
                Try adjusting your filters or add a new transaction
              </p>
              <UButton
                label="Add Transaction"
                icon="i-lucide-plus"
                size="sm"
                @click="openAddModal"
              />
            </div>
          </UContainer>
        </div>

        <!-- Create/Edit Modal -->
        <UModal v-model:open="isModalOpen">
          <template #content>
            <UContainer class="p-6 flex flex-col gap-5 w-full">
              <h3
                class="text-lg font-bold text-neutral-800 dark:text-neutral-100"
              >
                {{
                  editingTransaction ? "Edit Transaction" : "Add Transaction"
                }}
              </h3>

              <div>
                <p class="text-sm font-semibold mb-2">Transaction Name</p>
                <UInput
                  v-model="txName"
                  placeholder="e.g. Lunch at McD, Monthly Salary"
                  class="w-full"
                  autofocus
                />
              </div>

              <div>
                <p class="text-sm font-semibold mb-2">Transaction Type</p>
                <USelect
                  v-model="txType"
                  :items="[
                    { label: 'Spending', value: 'spending' },
                    { label: 'Income', value: 'income' },
                  ]"
                  class="w-full"
                />
              </div>

              <div>
                <p class="text-sm font-semibold mb-2">Category</p>
                <USelect
                  v-model="txCategoryId"
                  :items="
                    formCategories.map((c) => ({ label: c.name, value: c.id }))
                  "
                  class="w-full"
                  placeholder="Select category"
                />
              </div>

              <div>
                <p class="text-sm font-semibold mb-2">Amount</p>
                <UInputNumber
                  class="w-full"
                  v-model="txAmount"
                  :format-options="{
                    style: 'currency',
                    currency: 'IDR',
                    currencyDisplay: 'code',
                    currencySign: 'accounting',
                  }"
                />
              </div>

              <div>
                <p class="text-sm font-semibold mb-2">Notes (Optional)</p>
                <UTextarea
                  v-model="txNotes"
                  placeholder="Add details, store name, or description..."
                  class="w-full"
                />
              </div>

              <div
                class="flex justify-end gap-3 mt-4 border-t border-neutral-100 dark:border-neutral-800 pt-4"
              >
                <UButton
                  label="Cancel"
                  color="neutral"
                  variant="outline"
                  @click="isModalOpen = false"
                />
                <UButton
                  :label="editingTransaction ? 'Save Changes' : 'Create'"
                  color="primary"
                  @click="handleSaveTransaction"
                />
              </div>
            </UContainer>
          </template>
        </UModal>

        <!-- Delete Confirmation Modal -->
        <UModal v-model:open="isDeleteConfirmOpen">
          <template #content>
            <UContainer class="p-6 flex flex-col gap-4 max-w-sm">
              <div class="flex items-center gap-3 text-error">
                <UIcon name="i-lucide-triangle-alert" class="w-6 h-6" />
                <h3 class="text-lg font-bold">Delete Transaction?</h3>
              </div>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                Are you sure you want to delete this transaction for
                <strong>{{ transactionToDelete?.name }}</strong
                >? This action cannot be undone.
              </p>
              <div class="flex justify-end gap-3 mt-4">
                <UButton
                  label="Cancel"
                  color="neutral"
                  variant="outline"
                  @click="isDeleteConfirmOpen = false"
                />
                <UButton
                  label="Delete"
                  color="error"
                  @click="handleDeleteConfirm"
                />
              </div>
            </UContainer>
          </template>
        </UModal>

        <!-- Scanning Loading Overlay -->
        <UModal v-model:open="isScanning" prevent-close>
          <template #content>
            <div class="flex flex-col items-center justify-center p-8 gap-4">
              <UIcon
                name="i-lucide-loader-2"
                class="w-12 h-12 text-primary animate-spin"
              />
              <p class="font-semibold text-neutral-850 dark:text-neutral-100">
                Scanning receipt image...
              </p>
              <p class="text-sm text-neutral-500">
                Parsing items and finding best category matches with Gemini AI
              </p>
            </div>
          </template>
        </UModal>
      </UDashboardPanel>
    </UDashboardGroup>
  </div>
</template>
