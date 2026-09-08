<script setup lang="ts">
import { colorClassMap } from '~/constants/ui'

defineProps<{
  pocket: {
    id: number
    name: string
    type: string
    icon: string | null
    color: string | null
    budgetAmount: number
    spent: number
    earned: number
    remaining: number
  }
}>()

const emit = defineEmits<{
  'set-budget': [pocketId: number, currentAmount: number]
}>()

const { formatCurrency, getProgressColor } = useFormatters()
</script>

<template>
  <div
    role="link"
    tabindex="0"
    :aria-label="`${pocket.name} pocket details`"
    class="flex flex-col justify-between p-5 rounded-3xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm hover:shadow-md hover:border-neutral-300/80 dark:hover:border-neutral-700/80 transition-all duration-300 cursor-pointer group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500/50"
    @click="navigateTo(`/budgets/${pocket.id}`)"
    @keydown.enter="navigateTo(`/budgets/${pocket.id}`)"
  >
    <div>
      <div class="flex items-start justify-between gap-2 mb-4">
        <div
          :class="[
            'w-11 h-11 rounded-2xl flex items-center justify-center border',
            colorClassMap[pocket.color || 'slate'] || colorClassMap.slate
          ]"
        >
          <UIcon
            :name="pocket.icon || 'i-lucide-folder'"
            class="w-6 h-6"
          />
        </div>
        <UButton
          icon="i-lucide-sliders-horizontal"
          size="xs"
          color="neutral"
          variant="ghost"
          aria-label="Set pocket budget limit"
          class="md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
          @click.stop="emit('set-budget', pocket.id, pocket.budgetAmount)"
        />
      </div>

      <h4
        class="text-lg font-bold text-neutral-800 dark:text-neutral-100 group-hover:text-primary transition-colors duration-200"
      >
        {{ pocket.name }}
      </h4>
      <p class="text-xs text-neutral-500 capitalize mb-3">
        {{ pocket.type }} Pocket
      </p>

      <!-- Remaining/Earned Display -->
      <template v-if="pocket.type === 'spending'">
        <div class="mb-4">
          <template v-if="pocket.budgetAmount > 0">
            <p
              class="text-xl font-extrabold text-neutral-800 dark:text-neutral-100"
            >
              {{ formatCurrency(pocket.remaining) }}
            </p>
            <p class="text-xs text-neutral-500">
              remaining
            </p>
          </template>
          <template v-else>
            <p class="text-sm font-semibold text-neutral-400 py-1">
              No limit set
            </p>
          </template>
        </div>
      </template>
      <template v-else>
        <div class="mb-4">
          <p
            class="text-xl font-extrabold text-emerald-500 dark:text-emerald-400"
          >
            {{ formatCurrency(pocket.earned) }}
          </p>
          <p class="text-xs text-neutral-500">
            total earned
          </p>
        </div>
      </template>
    </div>

    <!-- Progress Bar -->
    <div
      v-if="pocket.type === 'spending' && pocket.budgetAmount > 0"
      class="w-full mt-2"
    >
      <div class="flex justify-between text-xxs mb-1 opacity-80">
        <span>Spent: {{ formatCurrency(pocket.spent) }}</span>
        <span>Limit: {{ formatCurrency(pocket.budgetAmount) }}</span>
      </div>
      <UProgress
        :model-value="pocket.spent"
        :max="pocket.budgetAmount"
        :color="getProgressColor(pocket.spent, pocket.budgetAmount)"
        size="xs"
      />
    </div>
    <div
      v-else-if="pocket.type === 'spending'"
      class="mt-2"
    >
      <UButton
        label="Set Limit"
        size="xs"
        color="neutral"
        variant="subtle"
        icon="i-lucide-plus"
        block
        @click.stop="emit('set-budget', pocket.id, 0)"
      />
    </div>
  </div>
</template>
