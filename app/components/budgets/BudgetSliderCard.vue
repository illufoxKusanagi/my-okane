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
  toggle: []
}>()

const { formatCurrency, getProgressColor } = useFormatters()

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
const progressPct = computed(() =>
  activeLimit.value > 0
    ? Math.round((activeSpent.value / activeLimit.value) * 100)
    : 0
)
</script>

<template>
  <div
    class="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-primary-600 to-primary-700 dark:from-neutral-900 dark:to-neutral-900/60 text-white border border-primary-500/20 dark:border-neutral-800/50 shadow-lg group transition-all duration-300 select-none cursor-pointer"
    @click="emit('toggle')"
  >
    <!-- Arrow overlays -->
    <button
      class="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200"
      @click.stop="emit('toggle')"
    >
      <UIcon
        name="i-lucide-chevron-left"
        class="w-5 h-5 text-white/80"
      />
    </button>
    <button
      class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200"
      @click.stop="emit('toggle')"
    >
      <UIcon
        name="i-lucide-chevron-right"
        class="w-5 h-5 text-white/80"
      />
    </button>

    <div class="px-8 text-center flex flex-col items-center">
      <!-- Title -->
      <div class="flex items-center gap-2 mb-2">
        <UIcon
          name="i-lucide-piggy-bank"
          class="w-5 h-5 text-primary-200 dark:text-primary-400"
        />
        <span
          class="text-xs font-black uppercase tracking-widest text-primary-100 dark:text-neutral-400"
        >
          {{
            currentView === "month"
              ? "Monthly Budget Overview"
              : "Weekly Budget Overview"
          }}
        </span>
      </div>

      <!-- Remaining Budget -->
      <template v-if="activeLimit > 0">
        <h2 class="text-3xl font-extrabold tracking-tight">
          {{ formatCurrency(activeRemaining) }}
        </h2>
        <p class="text-xs text-primary-100/90 dark:text-neutral-400 mt-1">
          remaining of {{ formatCurrency(activeLimit) }}
          {{ currentView === "month" ? "monthly" : "weekly" }} limit
          {{ currentView === "week" ? "(est.)" : "" }}
        </p>
      </template>
      <template v-else>
        <h2
          class="text-xl font-bold text-primary-200 dark:text-neutral-400 py-2"
        >
          No {{ currentView === "month" ? "Monthly" : "Weekly" }} Budget Set
        </h2>
        <UButton
          label="Configure in Budgets"
          size="xs"
          color="primary"
          variant="subtle"
          to="/budgets"
          @click.stop
        />
      </template>

      <!-- Progress bar -->
      <div
        v-if="activeLimit > 0"
        class="w-full max-w-md mt-5"
      >
        <div
          class="flex justify-between text-xxs opacity-75 mb-1.5 font-semibold"
        >
          <span>Spent: {{ formatCurrency(activeSpent) }}</span>
          <span>{{ progressPct }}%</span>
        </div>
        <UProgress
          :model-value="activeSpent"
          :max="activeLimit"
          :color="getProgressColor(activeSpent, activeLimit)"
          size="sm"
        />
      </div>
    </div>
  </div>
</template>
