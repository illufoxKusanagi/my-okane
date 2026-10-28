<script setup lang="ts">
import AppModal from '~/components/ui/AppModal.vue'
import CategoryFormFields from '~/components/categories/CategoryFormFields.vue'

const props = withDefaults(
  defineProps<{
    type?: 'income' | 'spending'
  }>(),
  {
    type: 'spending'
  }
)

const { addCategory } = useFinance()

const newCategoryName = ref('')
const selectedColor = ref('blue')
const selectedIcon = ref('i-lucide-folder')
const isOpen = ref(false)
const isSaving = ref(false)

const isInvalid = computed(() => !newCategoryName.value.trim())

const handleAddCategory = async () => {
  if (isInvalid.value || isSaving.value) return
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
      variant="outline"
      icon="i-lucide-plus"
      size="sm"
      @click="isOpen = true"
    >
      <span class="sm:hidden">{{ $t('common.add') }}</span>
      <span class="hidden sm:inline">{{ type === 'income' ? $t('dashboard.addIncomeCategory') : $t('dashboard.addSpendingCategory') }}</span>
    </UButton>

    <AppModal
      v-model:open="isOpen"
      :title="type === 'income' ? $t('categories.newIncomeCategory') : $t('categories.newSpendingCategory')"
      :submit-label="$t('common.create')"
      :loading="isSaving"
      :disabled="isInvalid"
      @submit="handleAddCategory"
    >
      <CategoryFormFields
        v-model:name="newCategoryName"
        v-model:color="selectedColor"
        v-model:icon="selectedIcon"
        :fixed-type="type"
        show-existing
      />
    </AppModal>
  </div>
</template>
