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
        Budget Limit
      </p>
      <p class="text-lg font-black text-default">
        {{
          props.budgetAmount > 0
            ? formatCurrency(props.budgetAmount)
            : "No Limit Set"
        }}
      </p>
    </div>
    <div>
      <p class="text-xs text-muted">
        {{ props.type === "spending" ? "Total Spent" : "Total Income" }}
      </p>
      <p
        :class="[
          'text-lg font-black',
          props.type === 'spending' ? 'text-rose-500' : 'text-emerald-500'
        ]"
      >
        {{
          props.type === "spending"
            ? formatCurrency(props.spent)
            : formatCurrency(props.earned)
        }}
      </p>
    </div>
  </div>
</template>
