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

const categoryTabs = [
  { label: 'Spending Categories', value: 'spending' },
  { label: 'Income Categories', value: 'income' }
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Category Management">
        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-plus"
              color="primary"
              aria-label="Add category"
              @click="openCreateModal"
            >
              <span class="sr-only sm:not-sr-only">Add Category</span>
            </UButton>
            <ColorModeButton />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer class="flex flex-col gap-6 max-w-6xl pb-12 sm:pb-8">
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
            No categories found
          </p>
          <p
            class="text-sm text-muted mt-1 mb-4"
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
    </template>
  </UDashboardPanel>
</template>
