<script setup lang="ts">
const props = defineProps<{
  globalBudget: {
    amount: number;
    spent: number;
    remaining: number;
  } | null;
}>();

const emit = defineEmits<{
  "set-budget": [currentAmount: number];
}>();

const { formatCurrency, getProgressColor } = useFormatters();

const progressPct = computed(() => {
  if (!props.globalBudget || props.globalBudget.amount <= 0) return 0;
  return Math.round(
    (props.globalBudget.spent / props.globalBudget.amount) * 100,
  );
});
</script>

<template>
  <div
    class="flex flex-col justify-between p-6 rounded-3xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 shadow-md backdrop-blur-md transition-all duration-300"
  >
    <div>
      <div class="flex items-center justify-between mb-2">
        <div
          class="flex items-center gap-2 text-neutral-500 dark:text-neutral-400"
        >
          <UIcon name="i-lucide-sliders-horizontal" class="w-5 h-5" />
          <span class="text-sm font-semibold tracking-wide uppercase"
            >Overall Monthly Limit</span
          >
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
          class="text-3xl font-extrabold text-neutral-800 dark:text-neutral-100 mb-4"
        >
          {{ formatCurrency(globalBudget.remaining) }}
          <span class="text-xs font-medium text-neutral-500 block mt-1"
            >remaining of {{ formatCurrency(globalBudget.amount) }}</span
          >
        </h2>
      </template>
      <template v-else>
        <div class="flex flex-col items-center justify-center py-4 text-center">
          <p class="text-sm text-neutral-500 mb-2">
            No global budget set for this month.
          </p>
          <UButton
            label="Set Limit"
            size="xs"
            @click="emit('set-budget', 0)"
          />
        </div>
      </template>
    </div>

    <div v-if="globalBudget" class="w-full">
      <div class="flex justify-between text-xs mb-1 font-semibold">
        <span class="text-neutral-500">Progress</span>
        <span class="text-neutral-700 dark:text-neutral-300">
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
