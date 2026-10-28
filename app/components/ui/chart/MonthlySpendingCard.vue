<script setup lang="ts">
const { getSpendingByCategory } = useFinance()
const { t, locale } = useI18n()

const spendingData = computed(() => getSpendingByCategory())

const currentMonthDescription = computed(() => {
  const localeTag = locale.value === 'en' ? 'en-US' : 'id-ID'
  const monthStr = new Date().toLocaleDateString(localeTag, { month: 'long', year: 'numeric' })
  return t('dashboard.expensesForMonth', { month: monthStr })
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
