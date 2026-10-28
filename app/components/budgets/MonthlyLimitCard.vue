<script setup lang="ts">
const props = defineProps<{
  globalBudget: {
    amount: number
    spent: number
    remaining: number
  } | null
}>()

const emit = defineEmits<{
  'set-budget': [currentAmount: number]
}>()

const { formatCurrency, getProgressColor } = useFormatters()

const progressPct = computed(() => {
  if (!props.globalBudget || props.globalBudget.amount <= 0) return 0
  return Math.round(
    (props.globalBudget.spent / props.globalBudget.amount) * 100
  )
})
</script>

<template>
  <div
    class="flex flex-col justify-between p-6 rounded-3xl bg-elevated border border-default shadow-md backdrop-blur-md transition-all duration-300"
  >
    <div>
      <div class="flex items-center justify-between mb-2">
        <div
          class="flex items-center gap-2 text-muted"
        >
          <UIcon
            name="i-lucide-sliders-horizontal"
            class="w-5 h-5"
          />
          <span class="text-sm font-semibold tracking-wide uppercase">{{ $t('budgets.overallMonthlyLimit') }}</span>
        </div>
        <UButton
          v-if="globalBudget"
          icon="i-lucide-pencil"
          size="xs"
          color="neutral"
          variant="ghost"
          @click="emit('set-budget', globalBudget.amount)"
        />
      </div>

      <template v-if="globalBudget">
        <h2
          class="text-3xl font-extrabold mb-4"
          :class="
            globalBudget.remaining < 0
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-default'
          "
        >
          {{ formatCurrency(globalBudget.remaining) }}
          <span class="text-xs font-medium text-muted block mt-1">{{ $t('budgets.remainingOf', { amount: formatCurrency(globalBudget.amount) }) }}</span>
        </h2>
      </template>
      <template v-else>
        <div class="flex flex-col items-center justify-center py-4 text-center">
          <p class="text-sm text-muted mb-2">
            {{ $t('budgets.noGlobalBudget') }}
          </p>
          <UButton
            :label="$t('budgets.setLimit')"
            size="xs"
            @click="emit('set-budget', 0)"
          />
        </div>
      </template>
    </div>

    <div
      v-if="globalBudget"
      class="w-full"
    >
      <div class="flex justify-between text-xs mb-1 font-semibold">
        <span class="text-muted">{{ $t('budgets.progress') }}</span>
        <span class="text-default">
          {{ progressPct }}%
        </span>
      </div>
      <UProgress
        :model-value="globalBudget.spent"
        :max="globalBudget.amount"
        :color="getProgressColor(globalBudget.spent, globalBudget.amount)"
        size="sm"
      />
    </div>
  </div>
</template>
