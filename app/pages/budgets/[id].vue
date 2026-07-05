<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Transaction } from "~/composables/useFinance";

const route = useRoute();
const router = useRouter();
const categoryId = Number(route.params.id);

const currentMonth = ref(new Date().toISOString().slice(0, 7));

const { data: budgetData, refresh } = await useFetch("/api/budgets", {
  query: { month: currentMonth },
});

const { transactions, addTransaction, deleteTransaction, updateTransaction } =
  useFinance();

const pocket = computed(() => {
  if (!budgetData.value) return null;
  return budgetData.value.pockets.find((p: any) => p.id === categoryId) || null;
});

const pocketTransactions = computed(() => {
  return transactions.value.filter((t) => {
    if (t.categoryId !== categoryId) return false;

    const tDate = new Date(t.transactionDate);
    const yyyymm = tDate.toISOString().slice(0, 7);
    return yyyymm === currentMonth.value;
  });
});

const pocketNumber = computed(() => {
  const prefix = "5059";
  const mid = String(categoryId).padStart(4, "0");
  const suffix = "8711";
  return `${prefix} ${mid} ${suffix}`;
});

const isBudgetModalOpen = ref(false);
const budgetAmount = ref<number | null>(null);

const isTxModalOpen = ref(false);
const txName = ref("");
const txAmount = ref<number | null>(null);
const txNotes = ref("");
const editingTx = ref<Transaction | null>(null);

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
};

const formatMonthLabel = (monthStr: string) => {
  const parts = monthStr.split("-").map(Number);
  const year = parts[0] ?? new Date().getFullYear();
  const month = parts[1] ?? new Date().getMonth() + 1;
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

const formatDateLabel = (dateVal: string | Date) => {
  const date = new Date(dateVal);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

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
  if (tx) {
    editingTx.value = tx;
    txName.value = tx.name;
    txAmount.value = tx.amount;
    txNotes.value = tx.notes || "";
  } else {
    editingTx.value = null;
    txName.value = "";
    txAmount.value = null;
    txNotes.value = "";
  }
  isTxModalOpen.value = true;
};

const handleSaveTransaction = async () => {
  if (!txName.value || !txAmount.value || !pocket.value) return;

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
      );
    } else {
      await addTransaction(
        txName.value,
        categoryId,
        txAmount.value,
        type,
        txNotes.value,
      );
    }
    isTxModalOpen.value = false;
    refresh();
  } catch (error) {
    console.error("Failed to save transaction:", error);
  }
};

const handleDeleteTx = async (txId: number) => {
  if (confirm("Are you sure you want to delete this transaction?")) {
    try {
      await deleteTransaction(txId);
      refresh();
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  }
};

const colorClassMap: Record<string, string> = {
  amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  yellow: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  pink: "text-pink-500 bg-pink-500/10 border-pink-500/20",
  slate: "text-slate-500 bg-slate-500/10 border-slate-500/20",
  emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  cyan: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
  indigo: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
  rose: "text-rose-500 bg-rose-500/10 border-rose-500/20",
};
</script>

<template>
  <div>
    <UDashboardGroup>
      <SideSidebar />
      <UDashboardPanel>
        <UDashboardNavbar title="Pocket Details">
          <template #left>
            <UButton
              icon="i-lucide-arrow-left"
              color="neutral"
              variant="ghost"
              @click="router.back()"
            />
          </template>
          <template #right>
            <ColorModeButton />
          </template>
        </UDashboardNavbar>

        <div
          v-if="pocket"
          class="h-full overflow-auto p-4 md:p-6 bg-slate-50/30 dark:bg-neutral-950/20"
        >
          <UContainer class="flex flex-col gap-6 max-w-2xl mx-auto">
            <!-- Pocket Jago Card -->
            <div
              class="flex flex-col items-center text-center p-8 rounded-3xl bg-primary-600 dark:bg-primary-950/30 text-white border border-primary-500/20 dark:border-primary-900/20 shadow-xl relative overflow-hidden"
            >
              <div
                class="absolute -right-20 -top-20 w-48 h-48 bg-white/5 rounded-full blur-2xl"
              ></div>

              <!-- Pocket Icon -->
              <div
                :class="[
                  'w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-white/20 mb-4 bg-white/10 shadow-inner',
                ]"
              >
                <UIcon
                  :name="pocket.icon || 'i-lucide-folder'"
                  class="w-9 h-9"
                />
              </div>

              <!-- Pocket Number (realistic) -->
              <p
                class="text-xs opacity-75 font-mono mb-2 tracking-widest flex items-center gap-1"
              >
                {{ pocketNumber }}
                <UIcon
                  name="i-lucide-copy"
                  class="w-3.5 h-3.5 cursor-pointer hover:opacity-100"
                />
              </p>

              <!-- Pocket Title -->
              <h2 class="text-2xl font-black mb-1">{{ pocket.name }}</h2>
              <p class="text-xs uppercase tracking-wider opacity-85 mb-5">
                {{ pocket.type }} Pocket
              </p>

              <!-- Main Large Balance -->
              <div class="mb-6">
                <template v-if="pocket.type === 'spending'">
                  <h1 class="text-4xl font-extrabold tracking-tight">
                    {{ formatCurrency(pocket.remaining) }}
                  </h1>
                  <p class="text-xs opacity-80 mt-1">Remaining Budget</p>
                </template>
                <template v-else>
                  <h1 class="text-4xl font-extrabold tracking-tight">
                    {{ formatCurrency(pocket.earned) }}
                  </h1>
                  <p class="text-xs opacity-80 mt-1">Total Earned</p>
                </template>
              </div>

              <!-- Quick Action Row -->
              <div
                class="flex flex-wrap items-center justify-center gap-3 mt-2 w-full max-w-sm pt-4 border-t border-white/10"
              >
                <UButton
                  :label="
                    pocket.type === 'spending'
                      ? 'Deposit / Spend'
                      : 'Add Income'
                  "
                  icon="i-lucide-plus"
                  size="sm"
                  color="neutral"
                  class="bg-white text-primary-700 hover:bg-white/95"
                  @click="openTxModal()"
                />

                <UButton
                  v-if="pocket.type === 'spending'"
                  label="Set Limit"
                  icon="i-lucide-sliders-horizontal"
                  size="sm"
                  variant="outline"
                  class="border-white/20 text-white hover:bg-white/10"
                  @click="openBudgetModal"
                />

                <UButton
                  v-if="pocket.type === 'spending' && pocket.budgetId"
                  label="Reset Limit"
                  icon="i-lucide-rotate-ccw"
                  size="sm"
                  variant="outline"
                  class="border-white/20 text-white hover:bg-white/10"
                  @click="handleDeleteBudget"
                />
              </div>
            </div>

            <!-- Stats Sub-details -->
            <div
              class="grid grid-cols-2 gap-4 bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 p-5 rounded-2xl shadow-sm backdrop-blur-md"
            >
              <div>
                <p class="text-xs text-neutral-500">Budget Limit</p>
                <p
                  class="text-lg font-black text-neutral-800 dark:text-neutral-100"
                >
                  {{
                    pocket.budgetAmount > 0
                      ? formatCurrency(pocket.budgetAmount)
                      : "No Limit Set"
                  }}
                </p>
              </div>
              <div>
                <p class="text-xs text-neutral-500">
                  {{
                    pocket.type === "spending" ? "Total Spent" : "Total Income"
                  }}
                </p>
                <p
                  :class="[
                    'text-lg font-black',
                    pocket.type === 'spending'
                      ? 'text-rose-500'
                      : 'text-emerald-500',
                  ]"
                >
                  {{
                    pocket.type === "spending"
                      ? formatCurrency(pocket.spent)
                      : formatCurrency(pocket.earned)
                  }}
                </p>
              </div>
            </div>

            <!-- Transaction History Listing -->
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <span
                  class="text-sm font-black uppercase tracking-wider text-neutral-400"
                >
                  Transactions ({{ formatMonthLabel(currentMonth) }})
                </span>
                <span class="text-xs text-neutral-500 font-mono">
                  {{ pocketTransactions.length }} items
                </span>
              </div>

              <!-- List -->
              <div
                v-if="pocketTransactions.length > 0"
                class="flex flex-col gap-3"
              >
                <div
                  v-for="tx in pocketTransactions"
                  :key="tx.id"
                  class="flex items-center justify-between p-4 rounded-2xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm hover:shadow-md transition-all duration-200 group"
                >
                  <div class="flex items-center gap-3">
                    <div
                      :class="[
                        'w-10 h-10 rounded-xl flex items-center justify-center border',
                        colorClassMap[pocket.color || 'slate'] ||
                          colorClassMap.slate,
                      ]"
                    >
                      <UIcon
                        :name="pocket.icon || 'i-lucide-folder'"
                        class="w-5 h-5"
                      />
                    </div>
                    <div>
                      <h5
                        class="font-bold text-neutral-800 dark:text-neutral-100 leading-snug"
                      >
                        {{ tx.name }}
                      </h5>
                      <p class="text-xxs text-neutral-500 leading-none mt-1">
                        {{ formatDateLabel(tx.transactionDate) }}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <span
                      :class="[
                        'font-black text-sm',
                        tx.type === 'spending'
                          ? 'text-neutral-800 dark:text-neutral-200'
                          : 'text-emerald-500',
                      ]"
                    >
                      {{ tx.type === "spending" ? "-" : "+"
                      }}{{ formatCurrency(tx.amount) }}
                    </span>

                    <!-- Hover Actions -->
                    <div
                      class="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <UButton
                        icon="i-lucide-pencil"
                        size="xs"
                        color="neutral"
                        variant="ghost"
                        @click="openTxModal(tx)"
                      />
                      <UButton
                        icon="i-lucide-trash-2"
                        size="xs"
                        color="error"
                        variant="ghost"
                        @click="handleDeleteTx(tx.id)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div
                v-else
                class="flex flex-col items-center justify-center p-12 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl text-center bg-white/20 dark:bg-neutral-900/10"
              >
                <UIcon
                  name="i-lucide-receipt"
                  class="w-8 h-8 text-neutral-400 mb-2"
                />
                <p class="text-sm font-semibold text-neutral-500">
                  No transactions in this pocket for
                  {{ formatMonthLabel(currentMonth) }}.
                </p>
              </div>
            </div>
          </UContainer>
        </div>

        <!-- Budget modal -->
        <UModal v-model:open="isBudgetModalOpen">
          <template #content>
            <UContainer class="p-6 flex flex-col gap-5 w-full">
              <h3
                class="text-lg font-bold text-neutral-800 dark:text-neutral-100"
              >
                Configure Pocket Limit
              </h3>
              <div>
                <p class="text-sm font-semibold mb-2">Limit Amount</p>
                <UInput
                  v-model="budgetAmount"
                  type="number"
                  placeholder="e.g. 1000000"
                  class="w-full"
                  autofocus
                />
              </div>
              <div
                class="flex justify-end gap-3 mt-4 border-t border-neutral-100 dark:border-neutral-800 pt-4"
              >
                <UButton
                  label="Cancel"
                  color="neutral"
                  variant="outline"
                  @click="isBudgetModalOpen = false"
                />
                <UButton
                  label="Save Limit"
                  color="primary"
                  @click="handleSaveBudget"
                />
              </div>
            </UContainer>
          </template>
        </UModal>

        <!-- Transaction modal -->
        <UModal v-model:open="isTxModalOpen">
          <template #content>
            <UContainer class="p-6 flex flex-col gap-5 w-full">
              <h3
                class="text-lg font-bold text-neutral-800 dark:text-neutral-100"
              >
                {{ editingTx ? "Edit Transaction" : "Add Transaction" }}
              </h3>
              <div>
                <p class="text-sm font-semibold mb-2">Name / Description</p>
                <UInput
                  v-model="txName"
                  placeholder="e.g. Coffee, Indomaret, Salary"
                  class="w-full"
                  autofocus
                />
              </div>
              <div>
                <p class="text-sm font-semibold mb-2">Amount (IDR)</p>
                <UInput
                  v-model="txAmount"
                  type="number"
                  placeholder="e.g. 50000"
                  class="w-full"
                />
              </div>
              <div>
                <p class="text-sm font-semibold mb-2">Notes (Optional)</p>
                <UInput
                  v-model="txNotes"
                  placeholder="Add some details..."
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
                  @click="isTxModalOpen = false"
                />
                <UButton
                  label="Save"
                  color="primary"
                  @click="handleSaveTransaction"
                />
              </div>
            </UContainer>
          </template>
        </UModal>
      </UDashboardPanel>
    </UDashboardGroup>
  </div>
</template>
