<script setup lang="ts">
import AppModal from '~/components/ui/AppModal.vue'
import DeleteConfirmModal from '~/components/ui/DeleteConfirmModal.vue'
import CategoryFormFields from '~/components/categories/CategoryFormFields.vue'
import CategoryCard from '~/components/categories/CategoryCard.vue'
import { useCategoriesController } from './useCategoriesController'

const {
  currentTab,
  isLoading,
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
</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Category Management">
      <template #left>
        <UDashboardSidebarToggle />
      </template>
      <template #right>
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-plus"
            color="primary"
            @click="openCreateModal"
          >
            <span class="sr-only sm:not-sr-only">Add Category</span>
          </UButton>
          <ColorModeButton />
        </div>
      </template>
    </UDashboardNavbar>

    <div class="h-full overflow-auto p-4 md:p-6">
      <UContainer class="flex flex-col gap-6 max-w-6xl">
        <!-- Tabs -->
        <div
          class="flex border-b border-neutral-200 dark:border-neutral-800"
        >
          <button
            :class="[
              'py-3 px-6 text-sm font-semibold border-b-2 transition-all duration-200 focus:outline-none',
              currentTab === 'spending'
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            ]"
            @click="currentTab = 'spending'"
          >
            Spending Categories
          </button>
          <button
            :class="[
              'py-3 px-6 text-sm font-semibold border-b-2 transition-all duration-200 focus:outline-none',
              currentTab === 'income'
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            ]"
            @click="currentTab = 'income'"
          >
            Income Categories
          </button>
        </div>

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
          class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/10"
        >
          <UIcon
            name="i-lucide-tag"
            class="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3"
          />
          <p class="font-semibold text-neutral-700 dark:text-neutral-300">
            No categories found
          </p>
          <p
            class="text-sm text-neutral-500 dark:text-neutral-500 mt-1 mb-4"
          >
            Create one to start organizing your transactions
          </p>
          <UButton
            label="Add Category"
            icon="i-lucide-plus"
            size="sm"
            @click="openCreateModal"
          />
        </div>
      </UContainer>
    </div>

    <!-- Create/Edit Modal -->
    <AppModal
      v-model:open="isModalOpen"
      :title="editingCategory ? 'Edit Category' : 'Create New Category'"
      :submit-label="editingCategory ? 'Save Changes' : 'Create'"
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
      title="Delete Category?"
      @confirm="handleDeleteConfirm"
    >
      Are you sure you want to delete
      <strong>{{ categoryToDelete?.name }}</strong>?
      This will also delete all transactions associated with this category.
    </DeleteConfirmModal>
  </UDashboardPanel>
</template>
