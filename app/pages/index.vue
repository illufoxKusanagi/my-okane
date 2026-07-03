<script setup lang="ts">
import MonthlySpendingCard from "~/components/ui/chart/MonthlySpendingCard.vue";
import MonthlyTrendChart from "~/components/ui/chart/MonthlyTrendChart.vue";

const { getTotalIncome, getTotalSpending, getCategories } = useFinance();

const totalIncome = computed(() => getTotalIncome());
const totalSpending = computed(() => getTotalSpending());
const spendingCategories = computed(() => getCategories("spending"));
const incomeCategories = computed(() => getCategories("income"));
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

        <div class="h-full overflow-auto p-4">
          <UContainer class="flex flex-col gap-4">
            <!-- Income and Spending Summary Cards -->
            <div class="flex flex-col md:flex-row gap-4">
              <IncomeCard label="Income" type="income" :amount="totalIncome" />
              <IncomeCard
                label="Spending"
                type="spending"
                :amount="totalSpending"
              />
            </div>

            <!-- Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <MonthlySpendingCard class="lg:col-span-1" />
              <MonthlyTrendChart class="lg:col-span-2" />
            </div>

            <!-- Add Category Buttons -->
            <div class="flex flex-col md:flex-row gap-2">
              <AddCategoryDrawer type="spending" />
              <AddCategoryDrawer type="income" />
            </div>

            <!-- Spending Details by Category -->
            <div
              v-if="spendingCategories.length > 0"
              class="flex flex-col gap-2"
            >
              <p class="text-lg font-semibold">Spending by Category</p>
              <SpendingDetail
                v-for="category in spendingCategories"
                :key="`spending-${category.id}`"
                :category="category"
              />
            </div>

            <!-- Income Details by Category -->
            <div v-if="incomeCategories.length > 0" class="flex flex-col gap-2">
              <p class="text-lg font-semibold">Income by Category</p>
              <SpendingDetail
                v-for="category in incomeCategories"
                :key="`income-${category.id}`"
                :category="category"
              />
            </div>
          </UContainer>
        </div>
      </UDashboardPanel>
    </UDashboardGroup>
  </div>
</template>
