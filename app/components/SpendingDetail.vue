<script setup lang="ts">
import { computed } from "vue";
import type { Category } from "~/composables/useFinance";

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

const colorClassMap: Record<string, string> = {
  amber: "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-900/30",
  blue: "text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-900/30",
  yellow: "text-yellow-500 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200/50 dark:border-yellow-900/30",
  purple: "text-purple-500 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border-purple-200/50 dark:border-purple-900/30",
  pink: "text-pink-500 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/30 border-pink-200/50 dark:border-pink-900/30",
  slate: "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/30 border-slate-200/50 dark:border-slate-900/30",
  emerald: "text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-900/30",
  cyan: "text-cyan-500 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200/50 dark:border-cyan-900/30",
  indigo: "text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200/50 dark:border-indigo-900/30",
  rose: "text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200/50 dark:border-rose-900/30",
};

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
