<script setup lang="ts">
const props = defineProps<{
  budgetAmount: number
  type: 'income' | 'spending'
  spent: number
  earned: number
}>()

const { formatCurrency } = useFormatters()
</script>

<template>
  <div
    class="grid grid-cols-2 gap-4 bg-elevated border border-default p-5 rounded-2xl shadow-sm backdrop-blur-md"
  >
    <div>
      <p class="text-xs text-muted">
        {{ $t('budgets.budgetLimit') }}
      </p>
      <p class="text-lg font-black text-default">
        {{
          props.budgetAmount > 0
            ? formatCurrency(props.budgetAmount)
            : $t('budgets.noLimitSet')
        }}
      </p>
    </div>
    <div>
      <p class="text-xs text-muted">
        {{ props.type === 'spending' ? $t('budgets.totalSpent') : $t('budgets.totalEarned') }}
      </p>
      <p
        :class="[
          'text-lg font-black',
          props.type === 'spending' ? 'text-rose-500' : 'text-emerald-500'
        ]"
      >
        {{
          props.type === 'spending'
            ? formatCurrency(props.spent)
            : formatCurrency(props.earned)
        }}
      </p>
    </div>
  </div>
</template>
