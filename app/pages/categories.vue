<script setup lang="ts">
import AppModal from "~/components/ui/AppModal.vue";
import ColorIconPicker from "~/components/ui/ColorIconPicker.vue";
import CategoryCard from "~/components/categories/CategoryCard.vue";
import { useCategoriesController } from "./useCategoriesController";

const {
  currentTab,
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
  handleDeleteConfirm,
} = useCategoriesController();
</script>

<template>
  <div>
    <UDashboardGroup>
      <SideSidebar />
      <UDashboardPanel>
        <UDashboardNavbar title="Category Management">
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

        <div class="h-full overflow-auto p-4">
          <UContainer class="py-6 flex flex-col gap-6 w-full">
            <!-- Tabs -->
            <div
              class="flex border-b border-neutral-200 dark:border-neutral-800"
            >
              <button
                @click="currentTab = 'spending'"
                :class="[
                  'py-3 px-6 text-sm font-semibold border-b-2 transition-all duration-200 focus:outline-none',
                  currentTab === 'spending'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
                ]"
              >
                Spending Categories
              </button>
              <button
                @click="currentTab = 'income'"
                :class="[
                  'py-3 px-6 text-sm font-semibold border-b-2 transition-all duration-200 focus:outline-none',
                  currentTab === 'income'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
                ]"
              >
                Income Categories
              </button>
            </div>

            <!-- Grid -->
            <div
              v-if="filteredCategories.length > 0"
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
          @submit="handleSaveCategory"
        >
          <div>
            <p class="text-sm font-semibold mb-2">Category Name</p>
            <UInput
              v-model="categoryName"
              placeholder="e.g. Health, Coffee, Salary"
              class="w-full"
              autofocus
            />
          </div>

          <div>
            <p class="text-sm font-semibold mb-2">Category Type</p>
            <USelect
              v-model="categoryType"
              :items="[
                { label: 'Spending', value: 'spending' },
                { label: 'Income', value: 'income' },
              ]"
              class="w-full"
            />
          </div>

          <ColorIconPicker
            v-model:color="categoryColor"
            v-model:icon="categoryIcon"
          />
        </AppModal>

        <!-- Delete Confirmation Modal -->
        <AppModal
          v-model:open="isDeleteConfirmOpen"
          title="Delete Category?"
          submit-label="Delete"
          @submit="handleDeleteConfirm"
        >
          <div class="flex items-center gap-3 text-error mb-2">
            <UIcon name="i-lucide-triangle-alert" class="w-6 h-6" />
            <span class="font-semibold">Warning: Irreversible Action</span>
          </div>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Are you sure you want to delete <strong>{{ categoryToDelete?.name }}</strong>?
            This will also delete all transactions associated with this category.
          </p>
        </AppModal>
      </UDashboardPanel>
    </UDashboardGroup>
  </div>
</template>
