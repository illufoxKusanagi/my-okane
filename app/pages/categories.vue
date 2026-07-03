<script setup lang="ts">
import { ref, computed } from "vue";
import type { Category } from "~/composables/useFinance";

const { categories, addCategory, updateCategory, deleteCategory } = useFinance();

// Tabs state
const currentTab = ref<"spending" | "income">("spending");

// Drawer/Modal state for Create/Edit
const isModalOpen = ref(false);
const editingCategory = ref<Category | null>(null);

// Form fields
const categoryName = ref("");
const categoryType = ref<"spending" | "income">("spending");
const categoryColor = ref("blue");
const categoryIcon = ref("i-lucide-folder");

// Confirmation modal for deleting
const isDeleteConfirmOpen = ref(false);
const categoryToDelete = ref<Category | null>(null);

// Lists of icons and colors to select from
const availableIcons = [
  "i-lucide-folder",
  "i-lucide-utensils",
  "i-lucide-car",
  "i-lucide-lightbulb",
  "i-lucide-film",
  "i-lucide-shopping-bag",
  "i-lucide-wallet",
  "i-lucide-briefcase",
  "i-lucide-trending-up",
  "i-lucide-gift",
  "i-lucide-heart-pulse",
  "i-lucide-graduation-cap",
  "i-lucide-home",
  "i-lucide-plane",
  "i-lucide-circle-help"
];

const availableColors = [
  "blue",
  "emerald",
  "amber",
  "rose",
  "purple",
  "pink",
  "yellow",
  "cyan",
  "indigo",
  "slate"
];

const colorClassMap: Record<string, string> = {
  amber: "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/30",
  blue: "text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/30",
  yellow: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900/30",
  purple: "text-purple-500 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/30",
  pink: "text-pink-500 bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-900/30",
  slate: "text-slate-500 bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-900/30",
  emerald: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/30",
  cyan: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-900/30",
  indigo: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/30",
  rose: "text-rose-500 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/30"
};

// Filtered categories based on selected tab
const filteredCategories = computed(() => {
  return categories.value.filter((c) => c.type === currentTab.value);
});

const openCreateModal = () => {
  editingCategory.value = null;
  categoryName.value = "";
  categoryType.value = currentTab.value;
  categoryColor.value = "blue";
  categoryIcon.value = "i-lucide-folder";
  isModalOpen.value = true;
};

const openEditModal = (cat: Category) => {
  editingCategory.value = cat;
  categoryName.value = cat.name;
  categoryType.value = cat.type;
  categoryColor.value = cat.color || "blue";
  categoryIcon.value = cat.icon || "i-lucide-folder";
  isModalOpen.value = true;
};

const handleSaveCategory = async () => {
  if (!categoryName.value.trim()) return;

  if (editingCategory.value) {
    await updateCategory(
      editingCategory.value.id,
      categoryName.value,
      categoryType.value,
      categoryIcon.value,
      categoryColor.value
    );
  } else {
    await addCategory(
      categoryName.value,
      categoryType.value,
      categoryIcon.value,
      categoryColor.value
    );
  }
  isModalOpen.value = false;
};

const confirmDeleteCategory = (cat: Category) => {
  categoryToDelete.value = cat;
  isDeleteConfirmOpen.value = true;
};

const handleDeleteConfirm = async () => {
  if (categoryToDelete.value) {
    await deleteCategory(categoryToDelete.value.id);
    isDeleteConfirmOpen.value = false;
    categoryToDelete.value = null;
  }
};
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
                <span class="hidden sm:inline">Add Category</span>
              </UButton>
              <ColorModeButton />
            </div>
          </template>
        </UDashboardNavbar>

        <div class="h-full overflow-auto p-4">
          <UContainer class="py-6 flex flex-col gap-6 w-full">
        <!-- Tabs -->
        <div class="flex border-b border-neutral-200 dark:border-neutral-800">
          <button
            @click="currentTab = 'spending'"
            :class="[
              'py-3 px-6 text-sm font-semibold border-b-2 transition-all duration-200 focus:outline-none',
              currentTab === 'spending'
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
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
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            ]"
          >
            Income Categories
          </button>
        </div>

        <!-- Grid -->
        <div v-if="filteredCategories.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="cat in filteredCategories"
            :key="cat.id"
            class="flex flex-col justify-between p-5 rounded-2xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm hover:shadow-md hover:border-neutral-300/80 dark:hover:border-neutral-700/80 transition-all duration-300 group"
          >
            <div class="flex items-center gap-3">
              <div
                :class="[
                  'w-10 h-10 rounded-xl flex items-center justify-center border',
                  colorClassMap[cat.color || 'slate'] || colorClassMap.slate
                ]"
              >
                <UIcon :name="cat.icon || 'i-lucide-folder'" class="w-5 h-5" />
              </div>
              <div>
                <p class="font-bold text-neutral-800 dark:text-neutral-100">
                  {{ cat.name }}
                </p>
                <p class="text-xs text-neutral-500 capitalize">
                  {{ cat.type }}
                </p>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-neutral-100 dark:border-neutral-800/50 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
              <UButton
                icon="i-lucide-pencil"
                size="xs"
                color="neutral"
                variant="ghost"
                @click="openEditModal(cat)"
              />
              <UButton
                icon="i-lucide-trash-2"
                size="xs"
                color="error"
                variant="ghost"
                @click="confirmDeleteCategory(cat)"
              />
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/10"
        >
          <UIcon name="i-lucide-tag" class="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3" />
          <p class="font-semibold text-neutral-700 dark:text-neutral-300">No categories found</p>
          <p class="text-sm text-neutral-500 dark:text-neutral-500 mt-1 mb-4">Create one to start organizing your transactions</p>
          <UButton label="Add Category" icon="i-lucide-plus" size="sm" @click="openCreateModal" />
        </div>
      </UContainer>
    </div>

    <!-- Create/Edit Modal -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <UContainer class="p-6 flex flex-col gap-5 w-full">
          <h3 class="text-lg font-bold text-neutral-800 dark:text-neutral-100">
            {{ editingCategory ? "Edit Category" : "Add Category" }}
          </h3>

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
                { label: 'Income', value: 'income' }
              ]"
              class="w-full"
            />
          </div>

          <div>
            <p class="text-sm font-semibold mb-2">Color Accent</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="color in availableColors"
                :key="color"
                @click="categoryColor = color"
                :class="[
                  'w-8 h-8 rounded-full border-2 transition-all duration-200 relative',
                  categoryColor === color ? 'border-primary scale-110 shadow-sm' : 'border-transparent opacity-85 hover:opacity-100'
                ]"
                :style="{ backgroundColor: `var(--color-${color}-500)` }"
              >
                <UIcon
                  v-if="categoryColor === color"
                  name="i-lucide-check"
                  class="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow-sm"
                />
              </button>
            </div>
          </div>

          <div>
            <p class="text-sm font-semibold mb-2">Icon Selector</p>
            <div class="grid grid-cols-5 gap-2 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 max-h-48 overflow-y-auto">
              <button
                v-for="icon in availableIcons"
                :key="icon"
                @click="categoryIcon = icon"
                :class="[
                  'flex items-center justify-center p-2 rounded-lg border transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                  categoryIcon === icon
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-neutral-600 dark:text-neutral-400'
                ]"
              >
                <UIcon :name="icon" class="w-6 h-6" />
              </button>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-4 border-t border-neutral-100 dark:border-neutral-800 pt-4">
            <UButton
              label="Cancel"
              color="neutral"
              variant="outline"
              @click="isModalOpen = false"
            />
            <UButton
              :label="editingCategory ? 'Save Changes' : 'Create'"
              color="primary"
              @click="handleSaveCategory"
            />
          </div>
        </UContainer>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteConfirmOpen">
      <template #content>
        <UContainer class="p-6 flex flex-col gap-4 max-w-sm">
          <div class="flex items-center gap-3 text-error">
            <UIcon name="i-lucide-triangle-alert" class="w-6 h-6" />
            <h3 class="text-lg font-bold">Delete Category?</h3>
          </div>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Are you sure you want to delete <strong>{{ categoryToDelete?.name }}</strong>?
            This will also delete all transactions associated with this category. This action cannot be undone.
          </p>
          <div class="flex justify-end gap-3 mt-4">
            <UButton
              label="Cancel"
              color="neutral"
              variant="outline"
              @click="isDeleteConfirmOpen = false"
            />
            <UButton
              label="Delete"
              color="error"
              @click="handleDeleteConfirm"
            />
          </div>
        </UContainer>
      </template>
    </UModal>
      </UDashboardPanel>
    </UDashboardGroup>
  </div>
</template>
