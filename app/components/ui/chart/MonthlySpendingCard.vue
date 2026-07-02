<script setup lang="ts">
const { getSpendingByCategory, getTotalSpending } = useFinance();

const spendingData = computed(() => getSpendingByCategory());
const totalSpending = computed(() => getTotalSpending());
</script>

<template>
  <!--
    Because PieChart.vue is inside app/components/ui/chart/,
    Nuxt auto-imports it as <UiChartPieChart />
  -->
  <UiChartPieChart
    title="Monthly Spending"
    description="Your actual expenses for this month"
    center-sub-label="Total Spent"
    trend="+2.1% from last month"
    trend-note="Based on your real data"
    :data="spendingData"
  />
</template>
