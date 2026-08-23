import { ref, computed } from "vue";
import type { Category } from "~/composables/useFinance";

export function useCategoriesController() {
  const { categories, addCategory, updateCategory, deleteCategory } =
    useFinance();

  const currentTab = ref<"spending" | "income">("spending");

  const isModalOpen = ref(false);
  const editingCategory = ref<Category | null>(null);

  const categoryName = ref("");
  const categoryType = ref<"spending" | "income">("spending");
  const categoryColor = ref("blue");
  const categoryIcon = ref("i-lucide-folder");

  const isDeleteConfirmOpen = ref(false);
  const categoryToDelete = ref<Category | null>(null);

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
        categoryColor.value,
      );
    } else {
      await addCategory(
        categoryName.value,
        categoryType.value,
        categoryIcon.value,
        categoryColor.value,
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

  return {
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
  };
}
