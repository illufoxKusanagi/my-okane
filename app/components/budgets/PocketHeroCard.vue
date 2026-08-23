<script setup lang="ts">
import { colorClassMap } from "~/constants/ui";

defineProps<{
  pocket: {
    name: string;
    type: string;
    icon: string | null;
    color: string | null;
    budgetAmount: number;
    spent: number;
    earned: number;
    remaining: number;
    budgetId: number | null;
  };
  pocketNumber: string;
}>();

const emit = defineEmits<{
  "add-transaction": [];
  "set-budget": [];
  "reset-budget": [];
}>();

const { formatCurrency } = useFormatters();
</script>

<template>
  <div
    class="flex flex-col items-center text-center p-8 rounded-3xl bg-primary-600 dark:bg-primary-950/30 text-white border border-primary-500/20 dark:border-primary-900/20 shadow-xl relative overflow-hidden"
  >
    <div
      class="absolute -right-20 -top-20 w-48 h-48 bg-white/5 rounded-full blur-2xl"
    ></div>

    <!-- Pocket Icon -->
    <div
      class="w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-white/20 mb-4 bg-white/10 shadow-inner"
    >
      <UIcon :name="pocket.icon || 'i-lucide-folder'" class="w-9 h-9" />
    </div>

    <!-- Pocket Number -->
    <p
      class="text-xs opacity-75 font-mono mb-2 tracking-widest flex items-center gap-1"
    >
      {{ pocketNumber }}
      <UIcon
        name="i-lucide-copy"
        class="w-3.5 h-3.5 cursor-pointer hover:opacity-100"
      />
    </p>

    <!-- Title -->
    <h2 class="text-2xl font-black mb-1">{{ pocket.name }}</h2>
    <p class="text-xs uppercase tracking-wider opacity-85 mb-5">
      {{ pocket.type }} Pocket
    </p>

    <!-- Main Balance -->
    <div class="mb-6">
      <template v-if="pocket.type === 'spending'">
        <h1 class="text-4xl font-extrabold tracking-tight">
          {{ formatCurrency(pocket.remaining) }}
        </h1>
        <p class="text-xs opacity-80 mt-1">Remaining Budget</p>
      </template>
      <template v-else>
        <h1 class="text-4xl font-extrabold tracking-tight">
          {{ formatCurrency(pocket.earned) }}
        </h1>
        <p class="text-xs opacity-80 mt-1">Total Earned</p>
      </template>
    </div>

    <!-- Quick Actions -->
    <div
      class="flex flex-wrap items-center justify-center gap-3 mt-2 w-full max-w-sm pt-4 border-t border-white/10"
    >
      <UButton
        :label="pocket.type === 'spending' ? 'Deposit / Spend' : 'Add Income'"
        icon="i-lucide-plus"
        size="sm"
        color="neutral"
        class="bg-white text-primary-700 hover:bg-white/95"
        @click="emit('add-transaction')"
      />
      <UButton
        v-if="pocket.type === 'spending'"
        label="Set Limit"
        icon="i-lucide-sliders-horizontal"
        size="sm"
        variant="outline"
        class="border-white/20 text-white hover:bg-white/10"
        @click="emit('set-budget')"
      />
      <UButton
        v-if="pocket.type === 'spending' && pocket.budgetId"
        label="Reset Limit"
        icon="i-lucide-rotate-ccw"
        size="sm"
        variant="outline"
        class="border-white/20 text-white hover:bg-white/10"
        @click="emit('reset-budget')"
      />
    </div>
  </div>
</template>
