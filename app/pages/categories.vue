<script setup lang="ts">
import AppModal from '~/components/ui/AppModal.vue'
import DeleteConfirmModal from '~/components/ui/DeleteConfirmModal.vue'
import CategoryFormFields from '~/components/categories/CategoryFormFields.vue'
import CategoryCard from '~/components/categories/CategoryCard.vue'
import { useCategoriesController } from './useCategoriesController'

const { t } = useI18n()

useSeoMeta({
  title: () => t('categories.title')
})

const {
  currentTab,
  isLoading,
  isSaving,
  isModalOpen,
  editingCategory,
  categoryName,
  categoryType,
  categoryColor,
  categoryIcon,
  isDeleteConfirmOpen,
  categoryToDelete,
  filteredCategories,
  openCreateModal,
  openEditModal,
  handleSaveCategory,
  confirmDeleteCategory,
  handleDeleteConfirm
} = useCategoriesController()

const categoryTabs = computed(() => [
  { label: t('categories.spendingCategories'), value: 'spending' },
  { label: t('categories.incomeCategories'), value: 'income' }
])
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 sm:p-6 lg:p-8 pb-12 sm:pb-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-highlighted">
          {{ $t('categories.title') }}
        </h1>
        <p class="text-xs sm:text-sm text-muted">
          {{ $t('categories.subtitle') }}
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        color="primary"
        :aria-label="$t('categories.addCategory')"
        @click="openCreateModal"
      >
        <span class="sr-only sm:not-sr-only">{{ $t('categories.addCategory') }}</span>
      </UButton>
    </div>

    <!-- Tabs -->
    <UTabs
      v-model="currentTab"
      :items="categoryTabs"
      class="w-full"
    />

    <!-- Grid / Skeletons -->
    <div
      v-if="isLoading"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <USkeleton
        v-for="i in 8"
        :key="`cat-skel-${i}`"
        class="h-28 rounded-2xl w-full"
      />
    </div>

    <div
      v-else-if="filteredCategories.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <CategoryCard
        v-for="cat in filteredCategories"
        :key="cat.id"
        :category="cat"
        @edit="openEditModal(cat)"
        @delete="confirmDeleteCategory(cat)"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-muted rounded-2xl bg-muted/20"
    >
      <UIcon
        name="i-lucide-tag"
        class="w-12 h-12 text-muted mb-3"
      />
      <p class="font-semibold text-highlighted">
        {{ $t('categories.noCategoriesFound') }}
      </p>
      <p
        class="text-sm text-muted mt-1 mb-4"
      >
        {{ $t('categories.createFirstCategory') }}
      </p>
      <UButton
        :label="$t('categories.addCategory')"
        icon="i-lucide-plus"
        size="sm"
        @click="openCreateModal"
      />
    </div>

    <!-- Create/Edit Modal -->
    <AppModal
      v-model:open="isModalOpen"
      :title="editingCategory ? $t('categories.editCategory') : $t('categories.createNewCategory')"
      :submit-label="editingCategory ? $t('common.saveChanges') : $t('common.create')"
      :loading="isSaving"
      :disabled="!categoryName.trim()"
      @submit="handleSaveCategory"
    >
      <CategoryFormFields
        v-model:name="categoryName"
        v-model:type="categoryType"
        v-model:color="categoryColor"
        v-model:icon="categoryIcon"
      />
    </AppModal>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      v-model:open="isDeleteConfirmOpen"
      :title="$t('categories.deleteCategory')"
      :loading="isSaving"
      @confirm="handleDeleteConfirm"
    >
      {{ $t('categories.deleteConfirmWarning', { name: categoryToDelete?.name }) }}
    </DeleteConfirmModal>
  </div>
</template>
