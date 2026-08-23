<script setup lang="ts">
import { ref, computed } from "vue";
import MonthlySpendingCard from "~/components/ui/chart/MonthlySpendingCard.vue";
import MonthlyTrendChart from "~/components/ui/chart/MonthlyTrendChart.vue";

const { transactions, getTotalIncome, getTotalSpending, getCategories } =
  useFinance();

const totalIncome = computed(() => getTotalIncome());
const totalSpending = computed(() => getTotalSpending());
const spendingCategories = computed(() => getCategories("spending"));
const incomeCategories = computed(() => getCategories("income"));

const currentView = ref<"month" | "week">("month");
const toggleView = () => {
  currentView.value = currentView.value === "month" ? "week" : "month";
};

const currentMonthStr = ref(new Date().toISOString().slice(0, 7));
const { data: budgetData } = await useFetch("/api/budgets", {
  query: { month: currentMonthStr },
});

const { formatCurrency } = useFormatters();

const monthlyBudgetLimit = computed(
  () => budgetData.value?.globalBudget?.amount || 0,
);
const monthlySpent = computed(() => budgetData.value?.totalSpending || 0);
const monthlyRemaining = computed(
  () => budgetData.value?.globalBudget?.remaining || 0,
);

const startOfWeekDate = computed(() => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
});

const weeklyTransactions = computed(() =>
  transactions.value.filter((t) => new Date(t.transactionDate) >= startOfWeekDate.value),
);
const weeklyIncome = computed(() =>
  weeklyTransactions.value
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0),
);
const weeklySpent = computed(() =>
  weeklyTransactions.value
    .filter((t) => t.type === "spending")
    .reduce((sum, t) => sum + t.amount, 0),
);
const weeklyBudgetLimit = computed(() =>
  Math.round(monthlyBudgetLimit.value / 4),
);
const weeklyRemaining = computed(() =>
  Math.max(0, weeklyBudgetLimit.value - weeklySpent.value),
);
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
            <BudgetSliderCard
              :current-view="currentView"
              :monthly-budget-limit="monthlyBudgetLimit"
              :monthly-spent="monthlySpent"
              :monthly-remaining="monthlyRemaining"
              :weekly-budget-limit="weeklyBudgetLimit"
              :weekly-spent="weeklySpent"
              :weekly-remaining="weeklyRemaining"
              @toggle="toggleView"
            />

            <!-- Income and Spending Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <IncomeCard label="Total Income" type="income" :amount="totalIncome" />
              <IncomeCard label="Total Spending" type="spending" :amount="totalSpending" />
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
            <div v-if="spendingCategories.length > 0" class="flex flex-col gap-3">
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
