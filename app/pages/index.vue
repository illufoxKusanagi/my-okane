<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BalanceCard from '~/components/budgets/BalanceCard.vue'
import MonthlySpendingCard from '~/components/ui/chart/MonthlySpendingCard.vue'
import MonthlyTrendChart from '~/components/ui/chart/MonthlyTrendChart.vue'
import WalletDeck from '~/components/wallets/WalletDeck.vue'
import BudgetSliderCard from '~/components/budgets/BudgetSliderCard.vue'

const { t } = useI18n()

useSeoMeta({
  title: () => t('dashboard.title')
})

const {
  transactions,
  isLoading,
  fetchAll,
  getTotalIncome,
  getTotalSpending,
  getCategories
} = useFinance()
const { wallets, totalNetWorth, fetchWallets } = useWallets()

const totalIncome = computed(() => getTotalIncome())
const totalSpending = computed(() => getTotalSpending())
const totalBalance = computed(() =>
  wallets.value.length > 0
    ? totalNetWorth.value
    : totalIncome.value - totalSpending.value
)
const spendingCategories = computed(() => getCategories('spending'))
const incomeCategories = computed(() => getCategories('income'))

const currentView = ref<'month' | 'week'>('month')

// Local-time month string; toISOString() would use UTC and can pick the
// wrong month for negative-offset timezones early in the month.
const _now = new Date()
const currentMonthStr = ref(
  `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}`
)
const { data: budgetData, status: budgetStatus, refresh: refreshBudgets }
  = useFetch('/api/budgets', {
    query: { month: currentMonthStr.value }
  })

onMounted(() => {
  fetchAll()
  fetchWallets(true)
  if (!budgetData.value) {
    refreshBudgets()
  }
})

const isBudgetLoading = computed(() => budgetStatus.value === 'pending')
const isPageLoading = computed(() => isBudgetLoading.value || isLoading.value)

// Monthly income and spent for current month sub-labels
const monthlyIncome = computed(() => budgetData.value?.totalIncome ?? totalIncome.value)
const monthlySpent = computed(() => budgetData.value?.totalSpending ?? totalSpending.value)

const totalPocketBudgetLimit = computed(() =>
  budgetData.value?.pockets?.reduce((sum, p) => sum + (p.budgetAmount || 0), 0) ?? 0
)
const monthlyBudgetLimit = computed(() =>
  budgetData.value?.globalBudget?.amount || totalPocketBudgetLimit.value || 0
)
const monthlyRemaining = computed(() => {
  if (budgetData.value?.globalBudget?.amount) {
    return budgetData.value.globalBudget.remaining
  }
  return totalPocketBudgetLimit.value > 0 ? totalPocketBudgetLimit.value - monthlySpent.value : 0
})

const startOfWeekDate = computed(() => {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0)
})

const weeklyTransactions = computed(() =>
  transactions.value.filter(
    t => new Date(t.transactionDate) >= startOfWeekDate.value
  )
)
const weeklySpent = computed(() =>
  weeklyTransactions.value
    .filter(t => t.type === 'spending')
    .reduce((sum, t) => sum + t.amount, 0)
)
// Weekly budget approximation dividing monthly budget evenly across 4 weeks
const weeklyBudgetLimit = computed(() =>
  Math.round(monthlyBudgetLimit.value / 4)
)
const weeklyRemaining = computed(
  () => weeklyBudgetLimit.value - weeklySpent.value
)
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 sm:p-6 lg:p-8 pb-12 sm:pb-8"
  >
    <!-- Hero Financial Overview: Balance Card & Budget Slider / Skeletons -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <BalanceCard
        :balance="totalBalance"
        :total-income="monthlyIncome"
        :total-spending="monthlySpent"
        :loading="isPageLoading"
      />
      <BudgetSliderCard
        :current-view="currentView"
        :monthly-budget-limit="monthlyBudgetLimit"
        :monthly-spent="monthlySpent"
        :monthly-remaining="monthlyRemaining"
        :weekly-budget-limit="weeklyBudgetLimit"
        :weekly-spent="weeklySpent"
        :weekly-remaining="weeklyRemaining"
        :loading="isBudgetLoading"
        @set-view="currentView = $event"
      />
    </div>

    <!-- Accounts & Banking Cards Carousel -->
    <WalletDeck :loading="isPageLoading" />

    <!-- Income and Spending Quick-Add Summary Cards / Skeletons -->
    <div
      v-if="isPageLoading"
      class="grid grid-cols-1 md:grid-cols-2 gap-5"
    >
      <USkeleton class="h-28 rounded-2xl w-full" />
      <USkeleton class="h-28 rounded-2xl w-full" />
    </div>
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 gap-5"
    >
      <IncomeCard
        :label="$t('dashboard.totalIncome')"
        type="income"
        :amount="totalIncome"
      />
      <IncomeCard
        :label="$t('dashboard.totalSpending')"
        type="spending"
        :amount="totalSpending"
      />
    </div>

    <!-- Charts / Skeletons -->
    <div
      v-if="isPageLoading"
      class="grid grid-cols-1 lg:grid-cols-3 gap-5"
    >
      <USkeleton class="h-80 rounded-2xl w-full lg:col-span-1" />
      <USkeleton class="h-80 rounded-2xl w-full lg:col-span-2" />
    </div>
    <div
      v-else
      class="grid grid-cols-1 lg:grid-cols-3 gap-5"
    >
      <MonthlySpendingCard class="lg:col-span-1" />
      <MonthlyTrendChart class="lg:col-span-2" />
    </div>

    <!-- Spending Details by Category / Skeletons -->
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between gap-3">
        <p class="text-lg font-bold tracking-tight text-highlighted">
          {{ $t("dashboard.spendingByCategory") }}
        </p>
        <AddCategoryModal type="spending" />
      </div>
      <div
        v-if="isPageLoading"
        class="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <USkeleton
          v-for="i in 4"
          :key="`spending-skel-${i}`"
          class="h-20 rounded-2xl w-full"
        />
      </div>
      <div
        v-else-if="spendingCategories.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <SpendingDetail
          v-for="category in spendingCategories"
          :key="`spending-${category.id}`"
          :category="category"
        />
      </div>
      <div
        v-else
        class="p-6 text-center border border-dashed border-muted rounded-2xl text-muted text-sm"
      >
        {{ $t("dashboard.noSpendingData") }}
      </div>
    </div>

    <!-- Income Details by Category / Skeletons -->
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between gap-3">
        <p class="text-lg font-bold tracking-tight text-highlighted">
          {{ $t("dashboard.incomeByCategory") }}
        </p>
        <AddCategoryModal type="income" />
      </div>
      <div
        v-if="isPageLoading"
        class="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <USkeleton
          v-for="i in 2"
          :key="`income-skel-${i}`"
          class="h-20 rounded-2xl w-full"
        />
      </div>
      <div
        v-else-if="incomeCategories.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <SpendingDetail
          v-for="category in incomeCategories"
          :key="`income-${category.id}`"
          :category="category"
        />
      </div>
      <div
        v-else
        class="p-6 text-center border border-dashed border-muted rounded-2xl text-muted text-sm"
      >
        {{ $t("dashboard.noIncomeData") }}
      </div>
    </div>
  </div>
</template>
