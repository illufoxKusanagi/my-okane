<script setup lang="ts">
import { computed } from 'vue'
import type { Category } from '~/composables/useFinance'
import { colorClassMap } from '~/constants/ui'

const props = defineProps<{
  category: Category
}>()

const { getTransactionsByCategory } = useFinance()

const transactions = computed(() =>
  getTransactionsByCategory(props.category.name).filter(
    t => t.type === props.category.type
  )
)

const total = computed(() =>
  transactions.value.reduce((sum, t) => sum + t.amount, 0)
)

const badgeClass = computed(() => {
  return colorClassMap[props.category.color || 'slate'] || colorClassMap.slate
})
</script>

<template>
  <div
    class="flex flex-row gap-4 h-16 bg-elevated border border-default rounded-xl py-4 px-5 items-center w-full shadow-sm hover:shadow-md transition-all duration-300 hover:border-default"
  >
    <div
      :class="[
        'flex w-10 h-10 rounded-lg items-center justify-center border',
        badgeClass
      ]"
    >
      <UIcon
        :name="category.icon || 'i-lucide-folder'"
        class="w-5 h-5"
      />
    </div>
    <div class="flex flex-col justify-center flex-1">
      <p class="text-xs font-semibold text-muted uppercase tracking-wider">
        {{ category.name }}
      </p>
      <p class="text-lg font-bold text-default tabular-nums">
        Rp. {{ total.toLocaleString() }}
      </p>
    </div>
    <div class="text-xs text-dimmed font-medium">
      {{ transactions.length }} trans.
    </div>
  </div>
</template>
