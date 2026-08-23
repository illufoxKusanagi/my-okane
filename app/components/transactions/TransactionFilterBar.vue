<script setup lang="ts">
import type { Category } from '~/composables/useFinance'

const searchQuery = defineModel<string>('searchQuery', { required: true })
const selectedType = defineModel<'all' | 'income' | 'spending'>('selectedType', {
  required: true
})
const selectedCategoryId = defineModel<number | 'all'>('selectedCategoryId', {
  required: true
})

defineProps<{
  categories: Category[]
  hasActiveFilters?: boolean
}>()

defineEmits<{
  reset: []
}>()
</script>

<template>
  <div
    class="flex flex-col sm:flex-row gap-4 items-center justify-between bg-neutral-50 dark:bg-neutral-900/40 p-4 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50"
  >
    <div class="w-full sm:w-1/3">
      <UInput
        v-model="searchQuery"
        icon="i-lucide-search"
        placeholder="Search transactions..."
        class="w-full"
      />
    </div>

    <div class="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto items-center justify-end">
      <div class="w-full sm:w-36">
        <USelect
          v-model="selectedType"
          :items="[
            { label: 'All Types', value: 'all' },
            { label: 'Income', value: 'income' },
            { label: 'Spending', value: 'spending' }
          ]"
          class="w-full"
        />
      </div>

      <div class="w-full sm:w-44">
        <USelect
          v-model="selectedCategoryId"
          :items="[
            { label: 'All Categories', value: 'all' },
            ...categories.map((c) => ({ label: c.name, value: c.id }))
          ]"
          class="w-full"
        />
      </div>

      <UButton
        v-if="hasActiveFilters"
        icon="i-lucide-rotate-ccw"
        color="neutral"
        variant="ghost"
        size="sm"
        title="Reset all filters"
        @click="$emit('reset')"
      >
        <span class="sr-only sm:not-sr-only">Reset</span>
      </UButton>
    </div>
  </div>
</template>
