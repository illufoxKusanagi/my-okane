<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps({
  type: {
    type: String as () => "income" | "spending",
    default: "spending",
  },
});

const { addCategory, getCategories } = useFinance();

const categories = computed(() => getCategories(props.type));
const newCategoryName = ref("");
const selectedColor = ref("blue");
const selectedIcon = ref("i-lucide-folder");
const isOpen = ref(false);

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
  "i-lucide-circle-help",
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
  "slate",
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
  rose: "text-rose-500 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/30",
};

const handleAddCategory = async () => {
  if (!newCategoryName.value.trim()) return;
  try {
    await addCategory(
      newCategoryName.value,
      props.type,
      selectedIcon.value,
      selectedColor.value
    );
    newCategoryName.value = "";
    selectedColor.value = "blue";
    selectedIcon.value = "i-lucide-folder";
    isOpen.value = false;
  } catch (error) {
    console.error("Failed to add category:", error);
  }
};
</script>

<template>
  <UModal v-model:open="isOpen">
    <UButton color="neutral">
      Add {{ type === "income" ? "Income" : "Spending" }} Category
    </UButton>

    <template #content>
      <UContainer class="p-6 flex flex-col gap-5 w-full">
        <h3 class="text-lg font-bold text-neutral-800 dark:text-neutral-100">
          Add New {{ type === "income" ? "Income" : "Spending" }} Category
        </h3>

        <div>
          <p class="text-sm font-semibold mb-2">Category Name</p>
          <UInput
            class="w-full"
            v-model="newCategoryName"
            placeholder="Enter category name"
            autofocus
          />
        </div>

        <div>
          <p class="text-sm font-semibold mb-2">Color Accent</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="color in availableColors"
              :key="color"
              @click="selectedColor = color"
              :class="[
                'w-8 h-8 rounded-full border-2 transition-all duration-200 relative',
                selectedColor === color
                  ? 'border-primary scale-110 shadow-sm'
                  : 'border-transparent opacity-85 hover:opacity-100',
              ]"
              :style="{ backgroundColor: `var(--color-${color}-500)` }"
              type="button"
            >
              <UIcon
                v-if="selectedColor === color"
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
              @click="selectedIcon = icon"
              :class="[
                'flex items-center justify-center p-2 rounded-lg border transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                selectedIcon === icon
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400',
              ]"
              type="button"
            >
              <UIcon :name="icon" class="w-6 h-6" />
            </button>
          </div>
        </div>

        <div>
          <p class="text-xs text-neutral-400 dark:text-neutral-500 mb-2">Existing Categories</p>
          <div class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-neutral-50/50 dark:bg-neutral-900/20 rounded-xl border border-neutral-200/30 dark:border-neutral-800/30">
            <UBadge
              v-for="cat in categories"
              :key="cat.id"
              variant="outline"
              :class="colorClassMap[cat.color || 'slate']"
            >
              {{ cat.name }}
            </UBadge>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-4 border-t border-neutral-100 dark:border-neutral-800 pt-4">
          <UButton
            label="Cancel"
            color="neutral"
            variant="outline"
            @click="isOpen = false"
          />
          <UButton
            label="Create"
            color="primary"
            @click="handleAddCategory"
          />
        </div>
      </UContainer>
    </template>
  </UModal>
</template>
