<script setup lang="ts">
import { ref, computed } from "vue";

const currentMonth = ref(new Date().toISOString().slice(0, 7));

const { data: budgetData, refresh } = await useFetch("/api/budgets", {
  query: { month: currentMonth },
});

const { addCategory } = useFinance();

const isModalOpen = ref(false);
const selectedCategoryId = ref<number | null>(null);
const budgetAmount = ref<number | null>(null);

const isCreatePocketModalOpen = ref(false);
const pocketName = ref("");
const pocketType = ref<"spending" | "income">("spending");
const pocketColor = ref("blue");
const pocketIcon = ref("i-lucide-folder");
const pocketBudgetLimit = ref<number | null>(null);

const availableColors = [
  "blue",
  "emerald",
  "amber",
  "rose",
  "purple",
  "pink",
  "yellow",
  "cyan",
  "indigo",
  "slate",
];

const availableIcons = [
  "i-lucide-folder",
  "i-lucide-utensils",
  "i-lucide-car",
  "i-lucide-lightbulb",
  "i-lucide-film",
  "i-lucide-shopping-bag",
  "i-lucide-wallet",
  "i-lucide-briefcase",
  "i-lucide-trending-up",
  "i-lucide-gift",
  "i-lucide-heart-pulse",
  "i-lucide-graduation-cap",
  "i-lucide-home",
  "i-lucide-plane",
  "i-lucide-circle-help",
];

const openCreatePocketModal = () => {
  pocketName.value = "";
  pocketType.value = "spending";
  pocketColor.value = "blue";
  pocketIcon.value = "i-lucide-folder";
  pocketBudgetLimit.value = null;
  isCreatePocketModalOpen.value = true;
};

const handleCreatePocket = async () => {
  if (!pocketName.value.trim()) return;

  try {
    const newCategory = await addCategory(
      pocketName.value,
      pocketType.value,
      pocketIcon.value,
      pocketColor.value,
    );

    if (
      newCategory &&
      pocketType.value === "spending" &&
      pocketBudgetLimit.value !== null &&
      pocketBudgetLimit.value > 0
    ) {
      await $fetch("/api/budgets", {
        method: "POST",
        body: {
          categoryId: newCategory.id,
          amount: pocketBudgetLimit.value,
          month: currentMonth.value,
        },
      });
    }

    isCreatePocketModalOpen.value = false;
    refresh();
  } catch (error) {
    console.error("Failed to create pocket:", error);
  }
};

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

const prevMonth = () => {
  const parts = currentMonth.value.split("-").map(Number);
  const year = parts[0] ?? new Date().getFullYear();
  const month = parts[1] ?? new Date().getMonth() + 1;
  const date = new Date(Date.UTC(year, month - 2, 1));
  currentMonth.value = date.toISOString().slice(0, 7);
};

const nextMonth = () => {
  const parts = currentMonth.value.split("-").map(Number);
  const year = parts[0] ?? new Date().getFullYear();
  const month = parts[1] ?? new Date().getMonth() + 1;
  const date = new Date(Date.UTC(year, month, 1));
  currentMonth.value = date.toISOString().slice(0, 7);
};

const colorClassMap: Record<string, string> = {
  amber:
    "text-amber-500 bg-amber-500/10 border-amber-500/20 dark:border-amber-900/30",
  blue: "text-blue-500 bg-blue-500/10 border-blue-500/20 dark:border-blue-900/30",
  yellow:
    "text-yellow-500 bg-yellow-500/10 border-yellow-500/20 dark:border-yellow-900/30",
  purple:
    "text-purple-500 bg-purple-500/10 border-purple-500/20 dark:border-purple-900/30",
  pink: "text-pink-500 bg-pink-500/10 border-pink-500/20 dark:border-pink-900/30",
  slate:
    "text-slate-500 bg-slate-500/10 border-slate-500/20 dark:border-slate-900/30",
  emerald:
    "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-900/30",
  cyan: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20 dark:border-cyan-900/30",
  indigo:
    "text-indigo-500 bg-indigo-500/10 border-indigo-500/20 dark:border-indigo-900/30",
  rose: "text-rose-500 bg-rose-500/10 border-rose-500/20 dark:border-rose-900/30",
};

const openBudgetModal = (categoryId: number | null, currentAmount = 0) => {
  selectedCategoryId.value = categoryId;
  budgetAmount.value = currentAmount || null;
  isModalOpen.value = true;
};

const handleSaveBudget = async () => {
  try {
    await $fetch("/api/budgets", {
      method: "POST",
      body: {
        categoryId: selectedCategoryId.value,
        amount: budgetAmount.value || 0,
        month: currentMonth.value,
      },
    });
    isModalOpen.value = false;
    refresh();
  } catch (error) {
    console.error("Failed to save budget:", error);
  }
};

const getProgressColor = (spent: number, limit: number) => {
  if (limit <= 0) return "neutral";
  const pct = (spent / limit) * 100;
  if (pct >= 100) return "error";
  if (pct >= 80) return "warning";
  return "success";
};
</script>

<template>
  <div>
    <UDashboardGroup>
      <SideSidebar />
      <UDashboardPanel>
        <UDashboardNavbar title="Budgets & Pockets">
          <template #right>
            <ColorModeButton />
          </template>
        </UDashboardNavbar>

        <div class="h-full overflow-auto p-4 md:p-6">
          <UContainer class="flex flex-col gap-6 max-w-6xl">
            <!-- Month Selection Header -->
            <div
              class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 p-5 rounded-2xl shadow-sm backdrop-blur-md"
            >
              <div class="flex items-center gap-3">
                <UButton
                  icon="i-lucide-chevron-left"
                  color="neutral"
                  variant="ghost"
                  @click="prevMonth"
                />
                <span
                  class="text-lg font-bold text-neutral-800 dark:text-neutral-100 min-w-44 text-center"
                >
                  {{ formatMonthLabel(currentMonth) }}
                </span>
                <UButton
                  icon="i-lucide-chevron-right"
                  color="neutral"
                  variant="ghost"
                  @click="nextMonth"
                />
              </div>

              <div class="flex items-center gap-2">
                <UButton
                  label="Create Pocket"
                  icon="i-lucide-plus"
                  color="primary"
                  @click="openCreatePocketModal"
                />
                <UButton
                  label="Set Monthly Limit"
                  icon="i-lucide-sliders-horizontal"
                  color="neutral"
                  variant="outline"
                  @click="
                    openBudgetModal(null, budgetData?.globalBudget?.amount)
                  "
                />
              </div>
            </div>

            <!-- Stats Overview Cards (Bank Jago-style) -->
            <div
              v-if="budgetData"
              class="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              <!-- Balance Pocket -->
              <div
                class="flex flex-col justify-between p-6 rounded-3xl bg-primary-600 dark:bg-primary-950/40 text-white border border-primary-500/20 dark:border-primary-900/30 shadow-lg relative overflow-hidden group transition-all duration-300"
              >
                <!-- Decorative Circle -->
                <div
                  class="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"
                ></div>

                <div>
                  <div class="flex items-center gap-2 mb-2 opacity-90">
                    <UIcon name="i-lucide-wallet" class="w-5 h-5" />
                    <span class="text-sm font-semibold tracking-wide uppercase"
                      >Main Account Balance</span
                    >
                  </div>
                  <h2 class="text-3xl font-extrabold tracking-tight mb-4">
                    {{ formatCurrency(budgetData.balance) }}
                  </h2>
                </div>

                <div
                  class="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-sm"
                >
                  <div>
                    <p class="opacity-80 text-xs">This Month Income</p>
                    <p class="font-bold text-emerald-300">
                      +{{ formatCurrency(budgetData.totalIncome) }}
                    </p>
                  </div>
                  <div>
                    <p class="opacity-80 text-xs">This Month Spent</p>
                    <p class="font-bold text-rose-300">
                      -{{ formatCurrency(budgetData.totalSpending) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Overall Monthly Budget -->
              <div
                class="flex flex-col justify-between p-6 rounded-3xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 shadow-md backdrop-blur-md transition-all duration-300"
              >
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <div
                      class="flex items-center gap-2 text-neutral-500 dark:text-neutral-400"
                    >
                      <UIcon
                        name="i-lucide-sliders-horizontal"
                        class="w-5 h-5"
                      />
                      <span
                        class="text-sm font-semibold tracking-wide uppercase"
                        >Overall Monthly Limit</span
                      >
                    </div>
                    <UButton
                      v-if="budgetData.globalBudget"
                      icon="i-lucide-pencil"
                      size="xs"
                      color="neutral"
                      variant="ghost"
                      @click="
                        openBudgetModal(null, budgetData.globalBudget.amount)
                      "
                    />
                  </div>

                  <template v-if="budgetData.globalBudget">
                    <h2
                      class="text-3xl font-extrabold text-neutral-800 dark:text-neutral-100 mb-4"
                    >
                      {{ formatCurrency(budgetData.globalBudget.remaining) }}
                      <span
                        class="text-xs font-medium text-neutral-500 block mt-1"
                        >remaining of
                        {{
                          formatCurrency(budgetData.globalBudget.amount)
                        }}</span
                      >
                    </h2>
                  </template>
                  <template v-else>
                    <div
                      class="flex flex-col items-center justify-center py-4 text-center"
                    >
                      <p class="text-sm text-neutral-500 mb-2">
                        No global budget set for this month.
                      </p>
                      <UButton
                        label="Set Limit"
                        size="xs"
                        @click="openBudgetModal(null)"
                      />
                    </div>
                  </template>
                </div>

                <div v-if="budgetData.globalBudget" class="w-full">
                  <div class="flex justify-between text-xs mb-1 font-semibold">
                    <span class="text-neutral-500">Progress</span>
                    <span class="text-neutral-700 dark:text-neutral-300">
                      {{
                        Math.round(
                          (budgetData.globalBudget.spent /
                            budgetData.globalBudget.amount) *
                            100,
                        )
                      }}%
                    </span>
                  </div>
                  <UProgress
                    :model-value="budgetData.globalBudget.spent"
                    :max="budgetData.globalBudget.amount"
                    :color="
                      getProgressColor(
                        budgetData.globalBudget.spent,
                        budgetData.globalBudget.amount,
                      )
                    "
                    size="sm"
                  />
                </div>
              </div>
            </div>

            <!-- pockets / Categories Pockets List -->
            <div v-if="budgetData" class="flex flex-col gap-4 mt-2">
              <div class="flex items-center justify-between">
                <h3
                  class="text-xl font-extrabold text-neutral-800 dark:text-neutral-100 tracking-tight"
                >
                  Your Pockets (Kantong)
                </h3>
              </div>

              <!-- Pockets Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div
                  v-for="pocket in budgetData.pockets"
                  :key="pocket.id"
                  @click="navigateTo(`/budgets/${pocket.id}`)"
                  class="flex flex-col justify-between p-5 rounded-3xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm hover:shadow-md hover:border-neutral-300/80 dark:hover:border-neutral-700/80 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                >
                  <div>
                    <div class="flex items-start justify-between gap-2 mb-4">
                      <!-- Category Icon Container -->
                      <div
                        :class="[
                          'w-11 h-11 rounded-2xl flex items-center justify-center border',
                          colorClassMap[pocket.color || 'slate'] ||
                            colorClassMap.slate,
                        ]"
                      >
                        <UIcon
                          :name="pocket.icon || 'i-lucide-folder'"
                          class="w-6 h-6"
                        />
                      </div>

                      <!-- Edit Pocket Action -->
                      <UButton
                        icon="i-lucide-sliders-horizontal"
                        size="xs"
                        color="neutral"
                        variant="ghost"
                        @click.stop="
                          openBudgetModal(pocket.id, pocket.budgetAmount)
                        "
                        class="md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
                      />
                    </div>

                    <!-- Pocket Info -->
                    <h4
                      class="text-lg font-bold text-neutral-800 dark:text-neutral-100 group-hover:text-primary transition-colors duration-200"
                    >
                      {{ pocket.name }}
                    </h4>
                    <p class="text-xs text-neutral-500 capitalize mb-3">
                      {{ pocket.type }} Pocket
                    </p>

                    <!-- Remaining/Earned Display -->
                    <template v-if="pocket.type === 'spending'">
                      <div class="mb-4">
                        <template v-if="pocket.budgetAmount > 0">
                          <p
                            class="text-xl font-extrabold text-neutral-800 dark:text-neutral-100"
                          >
                            {{ formatCurrency(pocket.remaining) }}
                          </p>
                          <p class="text-xs text-neutral-500">remaining</p>
                        </template>
                        <template v-else>
                          <p
                            class="text-sm font-semibold text-neutral-400 py-1"
                          >
                            No limit set
                          </p>
                        </template>
                      </div>
                    </template>
                    <template v-else>
                      <div class="mb-4">
                        <p
                          class="text-xl font-extrabold text-emerald-500 dark:text-emerald-400"
                        >
                          {{ formatCurrency(pocket.earned) }}
                        </p>
                        <p class="text-xs text-neutral-500">total earned</p>
                      </div>
                    </template>
                  </div>

                  <!-- Pocket Progress Bar -->
                  <div
                    v-if="pocket.type === 'spending' && pocket.budgetAmount > 0"
                    class="w-full mt-2"
                  >
                    <div class="flex justify-between text-xxs mb-1 opacity-80">
                      <span>Spent: {{ formatCurrency(pocket.spent) }}</span>
                      <span
                        >Limit: {{ formatCurrency(pocket.budgetAmount) }}</span
                      >
                    </div>
                    <UProgress
                      :model-value="pocket.spent"
                      :max="pocket.budgetAmount"
                      :color="
                        getProgressColor(pocket.spent, pocket.budgetAmount)
                      "
                      size="xs"
                    />
                  </div>
                  <div v-else-if="pocket.type === 'spending'" class="mt-2">
                    <UButton
                      label="Set Limit"
                      size="xs"
                      color="neutral"
                      variant="subtle"
                      icon="i-lucide-plus"
                      block
                      @click.stop="openBudgetModal(pocket.id, 0)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </UContainer>
        </div>

        <!-- Budget Configuration Modal -->
        <UModal v-model:open="isModalOpen">
          <template #content>
            <UContainer class="p-6 flex flex-col gap-5 w-full">
              <h3
                class="text-lg font-bold text-neutral-800 dark:text-neutral-100"
              >
                {{
                  selectedCategoryId === null
                    ? "Configure Overall Budget"
                    : "Configure Pocket Budget"
                }}
              </h3>

              <div>
                <p class="text-sm font-semibold mb-2">Budget Limit Amount</p>
                <UInput
                  v-model="budgetAmount"
                  type="number"
                  placeholder="e.g. 500000"
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
                  @click="isModalOpen = false"
                />
                <UButton
                  label="Save Budget"
                  color="primary"
                  @click="handleSaveBudget"
                />
              </div>
            </UContainer>
          </template>
        </UModal>

        <!-- Create Pocket Modal -->
        <UModal v-model:open="isCreatePocketModalOpen">
          <template #content>
            <UContainer class="p-6 flex flex-col gap-5 w-full">
              <h3
                class="text-lg font-bold text-neutral-800 dark:text-neutral-100"
              >
                Create New Pocket (Category)
              </h3>

              <div>
                <p class="text-sm font-semibold mb-2">Pocket Name</p>
                <UInput
                  v-model="pocketName"
                  placeholder="e.g. Emergency Fund, Vacation, Coffee"
                  class="w-full"
                  autofocus
                />
              </div>

              <div>
                <p class="text-sm font-semibold mb-2">Pocket Type</p>
                <USelect
                  v-model="pocketType"
                  :items="[
                    { label: 'Spending Pocket', value: 'spending' },
                    { label: 'Income Pocket', value: 'income' },
                  ]"
                  class="w-full"
                />
              </div>

              <div v-if="pocketType === 'spending'">
                <p class="text-sm font-semibold mb-2">
                  Monthly Budget Limit (Optional)
                </p>
                <UInput
                  v-model="pocketBudgetLimit"
                  type="number"
                  placeholder="e.g. 500000"
                  class="w-full"
                />
              </div>

              <div>
                <p class="text-sm font-semibold mb-2">Color Accent</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="color in availableColors"
                    :key="color"
                    @click="pocketColor = color"
                    :class="[
                      'w-8 h-8 rounded-full border-2 transition-all duration-200 relative',
                      pocketColor === color
                        ? 'border-primary scale-110 shadow-sm'
                        : 'border-transparent opacity-85 hover:opacity-100',
                    ]"
                    :style="{ backgroundColor: `var(--color-${color}-500)` }"
                  >
                    <UIcon
                      v-if="pocketColor === color"
                      name="i-lucide-check"
                      class="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow-sm"
                    />
                  </button>
                </div>
              </div>

              <div>
                <p class="text-sm font-semibold mb-2">Icon Selector</p>
                <div
                  class="grid grid-cols-5 gap-2 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 max-h-48 overflow-y-auto"
                >
                  <button
                    v-for="icon in availableIcons"
                    :key="icon"
                    @click="pocketIcon = icon"
                    :class="[
                      'flex items-center justify-center p-2 rounded-lg border transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                      pocketIcon === icon
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-neutral-600 dark:text-neutral-400',
                    ]"
                  >
                    <UIcon :name="icon" class="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div
                class="flex justify-end gap-3 mt-4 border-t border-neutral-100 dark:border-neutral-800 pt-4"
              >
                <UButton
                  label="Cancel"
                  color="neutral"
                  variant="outline"
                  @click="isCreatePocketModalOpen = false"
                />
                <UButton
                  label="Create Pocket"
                  color="primary"
                  @click="handleCreatePocket"
                />
              </div>
            </UContainer>
          </template>
        </UModal>
      </UDashboardPanel>
    </UDashboardGroup>
  </div>
</template>
