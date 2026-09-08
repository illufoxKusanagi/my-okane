<script setup lang="ts">
import { colorClassMap } from '~/constants/ui'
import type { Category } from '~/composables/useFinance'

defineProps<{
  category: Category
}>()

const emit = defineEmits<{
  edit: []
  delete: []
}>()
</script>

<template>
  <div
    class="flex flex-col justify-between p-5 rounded-2xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm hover:shadow-md hover:border-neutral-300/80 dark:hover:border-neutral-700/80 transition-all duration-300 group"
  >
    <div class="flex items-center gap-3">
      <div
        :class="[
          'w-10 h-10 rounded-xl flex items-center justify-center border',
          colorClassMap[category.color || 'slate'] || colorClassMap.slate
        ]"
      >
        <UIcon
          :name="category.icon || 'i-lucide-folder'"
          class="w-5 h-5"
        />
      </div>
      <div>
        <p class="font-bold text-neutral-800 dark:text-neutral-100">
          {{ category.name }}
        </p>
        <p class="text-xs text-neutral-500 capitalize">
          {{ category.type }}
        </p>
      </div>
    </div>

    <div
      class="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-neutral-100 dark:border-neutral-800/50 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
    >
      <UButton
        icon="i-lucide-pencil"
        size="xs"
        color="neutral"
        variant="ghost"
        :aria-label="`Edit ${category.name} category`"
        @click="emit('edit')"
      />
      <UButton
        icon="i-lucide-trash-2"
        size="xs"
        color="error"
        variant="ghost"
        :aria-label="`Delete ${category.name} category`"
        @click="emit('delete')"
      />
    </div>
  </div>
</template>
