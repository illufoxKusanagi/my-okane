<script setup lang="ts">
import AppModal from '~/components/ui/AppModal.vue'
import TransactionFormFields from '~/components/transactions/TransactionFormFields.vue'
import type { Category, Transaction } from '~/composables/useFinance'

const isOpen = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  editingTransaction: Transaction | null
  categories: Category[]
}>()

const txName = defineModel<string>('name', { required: true })
const txType = defineModel<'income' | 'spending'>('type', { required: true })
const txAmount = defineModel<number>('amount', { required: true })
const txCategoryId = defineModel<number | undefined>('categoryId', {
  required: true
})
const txNotes = defineModel<string>('notes', { required: true })
const txDate = defineModel<string>('date', { required: true })

defineEmits<{
  submit: []
}>()

const isInvalid = computed(
  () =>
    !txName.value.trim()
    || !txCategoryId.value
    || !(txAmount.value > 0)
    || !txDate.value
)
</script>

<template>
  <AppModal
    v-model:open="isOpen"
    :title="props.editingTransaction ? 'Edit Transaction' : 'Add Transaction'"
    :submit-label="props.editingTransaction ? 'Save Changes' : 'Create'"
    :disabled="isInvalid"
    @submit="$emit('submit')"
  >
    <TransactionFormFields
      v-model:name="txName"
      v-model:type="txType"
      v-model:category-id="txCategoryId"
      v-model:amount="txAmount"
      v-model:date="txDate"
      v-model:notes="txNotes"
      show-type
      show-category
      :categories="categories"
    />
  </AppModal>
</template>
