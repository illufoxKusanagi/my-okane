<script setup lang="ts">
import { computed } from "vue";
import type { Category } from "~/composables/useFinance";
import { colorClassMap } from "~/constants/ui";

const props = defineProps<{
  category: Category;
}>();

const { getTransactionsByCategory } = useFinance();

const transactions = computed(() =>
  getTransactionsByCategory(props.category.name).filter(
    (t) => t.type === props.category.type
  )
);

const total = computed(() =>
  transactions.value.reduce((sum, t) => sum + t.amount, 0)
);

const badgeClass = computed(() => {
  return colorClassMap[props.category.color || "slate"] || colorClassMap.slate;
});
</script>

<template>
  <div
    class="flex flex-row gap-4 h-16 bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 rounded-xl py-4 px-5 items-center w-full shadow-sm hover:shadow-md transition-all duration-300 hover:border-neutral-300/80 dark:hover:border-neutral-700/80"
  >
    <div
      :class="[
        'flex w-10 h-10 rounded-lg items-center justify-center border',
        badgeClass,
      ]"
    >
      <UIcon :name="category.icon || 'i-lucide-folder'" class="w-5 h-5" />
    </div>
    <div class="flex flex-col justify-center flex-1">
      <p class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
        {{ category.name }}
      </p>
      <p class="text-lg font-bold text-neutral-800 dark:text-neutral-100 tabular-nums">
        Rp. {{ total.toLocaleString() }}
      </p>
    </div>
    <div class="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
      {{ transactions.length }} trans.
    </div>
  </div>
</template>
