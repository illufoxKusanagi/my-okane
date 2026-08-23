<script setup lang="ts">
const { getSpendingByCategory } = useFinance();

const spendingData = computed(() => getSpendingByCategory());

const currentMonthDescription = computed(() => {
  return `Expenses for ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
});
</script>

<template>
  <UiChartPieChart
    title="Monthly Spending"
    :description="currentMonthDescription"
    center-sub-label="Total Spent"
    trend="Category Breakdown"
    trend-note="Based on your recorded transactions"
    :data="spendingData"
  />
</template>
