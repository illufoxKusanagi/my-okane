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
    class="flex flex-col justify-between p-5 rounded-2xl bg-elevated border border-default shadow-sm hover:shadow-md hover:border-default transition-all duration-300 group"
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
        <p class="font-bold text-default">
          {{ category.name }}
        </p>
        <p class="text-xs text-muted capitalize">
          {{ category.type === 'spending' ? $t('categories.spending') : $t('categories.income') }}
        </p>
      </div>
    </div>

    <div
      class="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-muted md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
    >
      <UButton
        icon="i-lucide-pencil"
        size="xs"
        color="neutral"
        variant="ghost"
        :aria-label="$t('categories.editCategoryAria', { name: category.name })"
        @click="emit('edit')"
      />
      <UButton
        icon="i-lucide-trash-2"
        size="xs"
        color="error"
        variant="ghost"
        :aria-label="$t('categories.deleteCategoryAria', { name: category.name })"
        @click="emit('delete')"
      />
    </div>
  </div>
</template>
