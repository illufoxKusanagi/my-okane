<script setup lang="ts">
const props = defineProps<{
  currentView: 'month' | 'week'
  monthlyBudgetLimit: number
  monthlySpent: number
  monthlyRemaining: number
  weeklyBudgetLimit: number
  weeklySpent: number
  weeklyRemaining: number
}>()

const emit = defineEmits<{
  (e: 'set-view', view: 'month' | 'week'): void
}>()

const { formatCurrency, getProgressColor } = useFormatters()
const { t } = useI18n()

const activeLimit = computed(() =>
  props.currentView === 'month'
    ? props.monthlyBudgetLimit
    : props.weeklyBudgetLimit
)
const activeSpent = computed(() =>
  props.currentView === 'month' ? props.monthlySpent : props.weeklySpent
)
const activeRemaining = computed(() =>
  props.currentView === 'month'
    ? props.monthlyRemaining
    : props.weeklyRemaining
)
const isOverBudget = computed(
  () => activeLimit.value > 0 && activeRemaining.value < 0
)
const progressPct = computed(() =>
  activeLimit.value > 0
    ? Math.round((activeSpent.value / activeLimit.value) * 100)
    : 0
)
const clampedSpent = computed(() =>
  Math.min(activeSpent.value, activeLimit.value)
)
const viewLabel = computed(() =>
  props.currentView === 'month' ? t('dashboard.monthly') : t('dashboard.weekly')
)
</script>

<template>
  <div
    class="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-primary-600 to-primary-700 dark:from-neutral-900 dark:to-neutral-900/60 text-white border border-primary-500/20 dark:border-neutral-800/50 shadow-lg transition-all duration-300 select-none"
  >
    <div class="px-4 sm:px-8 text-center flex flex-col items-center">
      <!-- Title -->
      <div class="flex items-center gap-2 mb-2">
        <UIcon
          name="i-lucide-piggy-bank"
          class="w-5 h-5 text-primary-200 dark:text-primary-400"
        />
        <span
          class="text-xs font-black uppercase tracking-widest text-primary-100 dark:text-neutral-400"
        >
          {{ $t('dashboard.budgetOverview', { period: viewLabel }) }}
        </span>
      </div>

      <!-- Month / Week segmented control -->
      <div
        class="flex items-center gap-1 p-1 rounded-full bg-white/15 dark:bg-neutral-800/80 mb-4"
        role="group"
        :aria-label="$t('dashboard.budgetPeriod')"
      >
        <button
          type="button"
          class="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
          :class="
            currentView === 'month'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-white/80 hover:bg-white/10 dark:text-neutral-300'
          "
          :aria-pressed="currentView === 'month'"
          @click="emit('set-view', 'month')"
        >
          {{ $t('dashboard.month') }}
        </button>
        <button
          type="button"
          class="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
          :class="
            currentView === 'week'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-white/80 hover:bg-white/10 dark:text-neutral-300'
          "
          :aria-pressed="currentView === 'week'"
          @click="emit('set-view', 'week')"
        >
          {{ $t('dashboard.week') }}
        </button>
      </div>

      <!-- Over Budget -->
      <template v-if="isOverBudget">
        <h2 class="text-3xl font-extrabold tracking-tight text-rose-200 dark:text-rose-300">
          {{ formatCurrency(-activeRemaining) }} {{ $t('dashboard.over') }}
        </h2>
        <p class="text-xs text-primary-100/90 dark:text-neutral-400 mt-1">
          {{
            $t('dashboard.spentOfLimit', {
              spent: formatCurrency(activeSpent),
              limit: formatCurrency(activeLimit),
              period: viewLabel,
              est: currentView === 'week' ? $t('dashboard.est') : ''
            })
          }}
        </p>
      </template>

      <!-- Within Budget -->
      <template v-else-if="activeLimit > 0">
        <h2 class="text-3xl font-extrabold tracking-tight">
          {{ formatCurrency(activeRemaining) }}
        </h2>
        <p class="text-xs text-primary-100/90 dark:text-neutral-400 mt-1">
          {{
            $t('dashboard.remainingOfLimit', {
              limit: formatCurrency(activeLimit),
              period: viewLabel,
              est: currentView === 'week' ? $t('dashboard.est') : ''
            })
          }}
        </p>
      </template>

      <!-- No Budget Set -->
      <template v-else>
        <h2
          class="text-xl font-bold text-primary-200 dark:text-neutral-400 py-2"
        >
          {{
            $t('dashboard.noBudgetSet', {
              period: currentView === 'month' ? $t('dashboard.month') : $t('dashboard.week')
            })
          }}
        </h2>
        <UButton
          :label="$t('dashboard.configureInBudgets')"
          size="xs"
          color="primary"
          variant="subtle"
          to="/budgets"
        />
      </template>

      <!-- Progress bar -->
      <div
        v-if="activeLimit > 0"
        class="w-full max-w-md mt-5"
      >
        <div
          class="flex justify-between text-[10px] opacity-75 mb-1.5 font-semibold"
        >
          <span>{{ $t('dashboard.spentLabel', { amount: formatCurrency(activeSpent) }) }}</span>
          <span>{{ progressPct }}%</span>
        </div>
        <UProgress
          :model-value="clampedSpent"
          :max="activeLimit"
          :color="getProgressColor(activeSpent, activeLimit)"
          size="sm"
        />
      </div>
    </div>
  </div>
</template>
