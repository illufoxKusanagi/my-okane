<script setup lang="ts">
import { ref, computed } from "vue";
import MonthlySpendingCard from "~/components/ui/chart/MonthlySpendingCard.vue";
import MonthlyTrendChart from "~/components/ui/chart/MonthlyTrendChart.vue";

const { transactions, getTotalIncome, getTotalSpending, getCategories } = useFinance();

const totalIncome = computed(() => getTotalIncome());
const totalSpending = computed(() => getTotalSpending());
const spendingCategories = computed(() => getCategories("spending"));
const incomeCategories = computed(() => getCategories("income"));

// Budget Slide/Toggle view: 'month' | 'week'
const currentView = ref<"month" | "week">("month");

const toggleView = () => {
  currentView.value = currentView.value === "month" ? "week" : "month";
};

// Fetch monthly budget data dynamically
const currentMonthStr = ref(new Date().toISOString().slice(0, 7));
const { data: budgetData } = await useFetch("/api/budgets", {
  query: { month: currentMonthStr },
});

const monthlyBudgetLimit = computed(() => budgetData.value?.globalBudget?.amount || 0);
const monthlySpent = computed(() => budgetData.value?.totalSpending || 0);
const monthlyRemaining = computed(() => budgetData.value?.globalBudget?.remaining || 0);

// Weekly calculations
const startOfWeekDate = computed(() => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
});

const weeklyTransactions = computed(() => {
  return transactions.value.filter((t) => {
    const tDate = new Date(t.transactionDate);
    return tDate >= startOfWeekDate.value;
  });
});

const weeklyIncome = computed(() => {
  return weeklyTransactions.value
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
});

const weeklySpent = computed(() => {
  return weeklyTransactions.value
    .filter((t) => t.type === "spending")
    .reduce((sum, t) => sum + t.amount, 0);
});

const weeklyBudgetLimit = computed(() => {
  return Math.round(monthlyBudgetLimit.value / 4);
});

const weeklyRemaining = computed(() => {
  return Math.max(0, weeklyBudgetLimit.value - weeklySpent.value);
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
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
        <UDashboardNavbar title="Dashboard">
          <template #right>
            <ColorModeButton />
          </template>
        </UDashboardNavbar>

        <div class="h-full overflow-auto p-4 md:p-6">
          <UContainer class="flex flex-col gap-6 max-w-6xl">
            
            <!-- Swipable/Toggleable Budget Slider Card -->
            <div
              class="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-primary-600 to-primary-700 dark:from-neutral-900 dark:to-neutral-900/60 text-white border border-primary-500/20 dark:border-neutral-800/50 shadow-lg group transition-all duration-300 select-none cursor-pointer"
              @click="toggleView"
            >
              <!-- Arrow overlays for visual indicators of sliding -->
              <button
                class="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200"
                @click.stop="toggleView"
              >
                <UIcon name="i-lucide-chevron-left" class="w-5 h-5 text-white/80" />
              </button>
              
              <button
                class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200"
                @click.stop="toggleView"
              >
                <UIcon name="i-lucide-chevron-right" class="w-5 h-5 text-white/80" />
              </button>

              <div class="px-8 text-center flex flex-col items-center">
                <!-- Title / period indicator -->
                <div class="flex items-center gap-2 mb-2">
                  <UIcon name="i-lucide-piggy-bank" class="w-5 h-5 text-primary-200 dark:text-primary-400" />
                  <span class="text-xs font-black uppercase tracking-widest text-primary-100 dark:text-neutral-400">
                    {{ currentView === "month" ? "Monthly Budget Overview" : "Weekly Budget Overview" }}
                  </span>
                </div>

                <!-- Remaining Budget / Info -->
                <template v-if="currentView === 'month'">
                  <template v-if="monthlyBudgetLimit > 0">
                    <h2 class="text-3xl font-extrabold tracking-tight">
                      {{ formatCurrency(monthlyRemaining) }}
                    </h2>
                    <p class="text-xs text-primary-100/90 dark:text-neutral-400 mt-1">
                      remaining of {{ formatCurrency(monthlyBudgetLimit) }} monthly limit
                    </p>
                  </template>
                  <template v-else>
                    <h2 class="text-xl font-bold text-primary-200 dark:text-neutral-400 py-2">
                      No Monthly Budget Set
                    </h2>
                    <UButton
                      label="Configure in Budgets"
                      size="xs"
                      color="primary"
                      variant="subtle"
                      to="/budgets"
                      @click.stop
                    />
                  </template>
                </template>

                <template v-else>
                  <template v-if="weeklyBudgetLimit > 0">
                    <h2 class="text-3xl font-extrabold tracking-tight">
                      {{ formatCurrency(weeklyRemaining) }}
                    </h2>
                    <p class="text-xs text-primary-100/90 dark:text-neutral-400 mt-1">
                      remaining of {{ formatCurrency(weeklyBudgetLimit) }} weekly limit (est.)
                    </p>
                  </template>
                  <template v-else>
                    <h2 class="text-xl font-bold text-primary-200 dark:text-neutral-400 py-2">
                      No Weekly Budget Set
                    </h2>
                    <UButton
                      label="Configure in Budgets"
                      size="xs"
                      color="primary"
                      variant="subtle"
                      to="/budgets"
                      @click.stop
                    />
                  </template>
                </template>

                <!-- Progress bar -->
                <div
                  v-if="(currentView === 'month' && monthlyBudgetLimit > 0) || (currentView === 'week' && weeklyBudgetLimit > 0)"
                  class="w-full max-w-md mt-5"
                >
                  <div class="flex justify-between text-xxs opacity-75 mb-1.5 font-semibold">
                    <span>
                      Spent: {{ formatCurrency(currentView === 'month' ? monthlySpent : weeklySpent) }}
                    </span>
                    <span>
                      {{
                        Math.round(
                          ((currentView === 'month' ? monthlySpent : weeklySpent) /
                            (currentView === 'month' ? monthlyBudgetLimit : weeklyBudgetLimit)) *
                            100,
                        )
                      }}%
                    </span>
                  </div>
                  <UProgress
                    :model-value="currentView === 'month' ? monthlySpent : weeklySpent"
                    :max="currentView === 'month' ? monthlyBudgetLimit : weeklyBudgetLimit"
                    :color="
                      getProgressColor(
                        currentView === 'month' ? monthlySpent : weeklySpent,
                        currentView === 'month' ? monthlyBudgetLimit : weeklyBudgetLimit,
                      )
                    "
                    size="sm"
                  />
                </div>
              </div>
            </div>

            <!-- Income and Spending Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <IncomeCard label="Total Income" type="income" :amount="totalIncome" />
              <IncomeCard
                label="Total Spending"
                type="spending"
                :amount="totalSpending"
              />
            </div>

            <!-- Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <MonthlySpendingCard class="lg:col-span-1" />
              <MonthlyTrendChart class="lg:col-span-2" />
            </div>

            <!-- Add Category Buttons -->
            <div class="flex flex-wrap gap-3">
              <AddCategoryModal type="spending" />
              <AddCategoryModal type="income" />
            </div>

            <!-- Spending Details by Category -->
            <div
              v-if="spendingCategories.length > 0"
              class="flex flex-col gap-3"
            >
              <p class="text-lg font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
                Spending by Category
              </p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SpendingDetail
                  v-for="category in spendingCategories"
                  :key="`spending-${category.id}`"
                  :category="category"
                />
              </div>
            </div>

            <!-- Income Details by Category -->
            <div v-if="incomeCategories.length > 0" class="flex flex-col gap-3">
              <p class="text-lg font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
                Income by Category
              </p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SpendingDetail
                  v-for="category in incomeCategories"
                  :key="`income-${category.id}`"
                  :category="category"
                />
              </div>
            </div>
          </UContainer>
        </div>
      </UDashboardPanel>
    </UDashboardGroup>
  </div>
</template>
