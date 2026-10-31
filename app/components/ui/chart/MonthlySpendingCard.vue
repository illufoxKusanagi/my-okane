<script setup lang="ts">
import { computed } from 'vue'

const { getSpendingByCategory } = useFinance()
const { periodLabel } = usePeriod()
const { t } = useI18n()

const spendingData = computed(() => getSpendingByCategory())

const currentMonthDescription = computed(() => {
  return t('dashboard.expensesForMonth', { month: periodLabel.value })
})
</script>

<template>
  <UiChartPieChart
    :title="$t('dashboard.monthlySpending')"
    :description="currentMonthDescription"
    :center-sub-label="$t('dashboard.totalSpent')"
    :trend="$t('dashboard.categoryBreakdown')"
    :trend-note="$t('dashboard.basedOnTransactions')"
    :data="spendingData"
  />
</template>
