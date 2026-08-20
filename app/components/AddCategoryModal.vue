<script setup lang="ts">
import AppModal from '~/components/ui/AppModal.vue'
import ColorIconPicker from '~/components/ui/ColorIconPicker.vue'
import { colorClassMap } from '~/constants/ui'

const props = withDefaults(
  defineProps<{
    type?: 'income' | 'spending'
  }>(),
  {
    type: 'spending'
  }
)

const { addCategory, getCategories } = useFinance()

const categories = computed(() => getCategories(props.type))
const newCategoryName = ref('')
const selectedColor = ref('blue')
const selectedIcon = ref('i-lucide-folder')
const isOpen = ref(false)
const isSaving = ref(false)

const handleAddCategory = async () => {
  if (!newCategoryName.value.trim() || isSaving.value) return
  isSaving.value = true
  try {
    await addCategory(
      newCategoryName.value,
      props.type,
      selectedIcon.value,
      selectedColor.value
    )
    newCategoryName.value = ''
    selectedColor.value = 'blue'
    selectedIcon.value = 'i-lucide-folder'
    isOpen.value = false
  } catch (error) {
    console.error('Failed to add category:', error)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div>
    <UButton
      color="neutral"
      @click="isOpen = true"
    >
      Add {{ type === "income" ? "Income" : "Spending" }} Category
    </UButton>

    <AppModal
      v-model:open="isOpen"
      :title="`Add New ${type === 'income' ? 'Income' : 'Spending'} Category`"
      submit-label="Create"
      :loading="isSaving"
      @submit="handleAddCategory"
    >
      <div>
        <p class="text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
          Category Name
        </p>
        <UInput
          v-model="newCategoryName"
          class="w-full"
          placeholder="Enter category name"
          autofocus
        />
      </div>

      <ColorIconPicker
        v-model:color="selectedColor"
        v-model:icon="selectedIcon"
      />

      <div v-if="categories.length > 0">
        <p class="text-xs text-neutral-400 dark:text-neutral-500 mb-2">
          Existing Categories
        </p>
        <div
          class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-neutral-50/50 dark:bg-neutral-900/20 rounded-xl border border-neutral-200/30 dark:border-neutral-800/30"
        >
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
    </AppModal>
  </div>
</template>
