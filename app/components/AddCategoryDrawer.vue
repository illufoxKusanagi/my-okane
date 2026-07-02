<script setup lang="ts">
const props = defineProps({
  type: {
    type: String as () => "income" | "spending",
    default: "spending",
  },
});

const { addCategory, getCategories } = useFinance();

const categories = computed(() => getCategories(props.type));
const newCategoryName = ref("");

const handleAddCategory = () => {
  if (newCategoryName.value.trim()) {
    addCategory(newCategoryName.value, props.type);
    newCategoryName.value = "";
  }
};
</script>

<template>
  <UDrawer handle-only>
    <UButton color="neutral"
      >Add {{ type === "income" ? "Income" : "Spending" }} Category</UButton
    >
    <template #content>
      <UContainer class="flex flex-col gap-4 py-8">
        <p class="text-lg font-semibold">
          Add New {{ type === "income" ? "Income" : "Spending" }} Category
        </p>

        <div>
          <p class="text-sm mb-2">Category Name</p>
          <UInput
            class="w-full"
            v-model="newCategoryName"
            placeholder="Enter category name"
          />
        </div>

        <div>
          <p class="text-sm mb-2">Current Categories</p>
          <div class="flex flex-wrap gap-2">
            <UBadge v-for="cat in categories" :key="cat.id" :color="(cat.color as any) || 'blue'">
              {{ cat.name }}
            </UBadge>
          </div>
        </div>

        <UButton @click="handleAddCategory" class="justify-center">
          Add Category
        </UButton>
      </UContainer>
    </template>
  </UDrawer>
</template>
