<script setup lang="ts">
import AppModal from '~/components/ui/AppModal.vue'
import type { Category, Transaction } from '~/composables/useFinance'

const isOpen = defineModel<boolean>('open', { required: true })

defineProps<{
  editingTransaction: Transaction | null
  categories: Category[]
}>()

const txName = defineModel<string>('name', { required: true })
const txType = defineModel<'income' | 'spending'>('type', { required: true })
const txAmount = defineModel<number>('amount', { required: true })
const txCategoryId = defineModel<number | undefined>('categoryId', { required: true })
const txNotes = defineModel<string>('notes', { required: true })

defineEmits<{
  submit: []
}>()
</script>

<template>
  <AppModal
    v-model:open="isOpen"
    :title="editingTransaction ? 'Edit Transaction' : 'Add Transaction'"
    :submit-label="editingTransaction ? 'Save Changes' : 'Create'"
    @submit="$emit('submit')"
  >
    <div>
      <p class="text-sm font-semibold mb-2">
        Transaction Name
      </p>
      <UInput
        v-model="txName"
        placeholder="e.g. Lunch at McD, Monthly Salary"
        class="w-full"
        autofocus
      />
    </div>

    <div>
      <p class="text-sm font-semibold mb-2">
        Transaction Type
      </p>
      <USelect
        v-model="txType"
        :items="[
          { label: 'Spending', value: 'spending' },
          { label: 'Income', value: 'income' }
        ]"
        class="w-full"
      />
    </div>

    <div>
      <p class="text-sm font-semibold mb-2">
        Category
      </p>
      <USelect
        v-model="txCategoryId"
        :items="categories.map((c) => ({ label: c.name, value: c.id }))"
        class="w-full"
        placeholder="Select category"
      />
    </div>

    <div>
      <p class="text-sm font-semibold mb-2">
        Amount
      </p>
      <UInputNumber
        v-model="txAmount"
        class="w-full"
        :format-options="{
          style: 'currency',
          currency: 'IDR',
          currencyDisplay: 'code',
          currencySign: 'accounting'
        }"
      />
    </div>

    <div>
      <p class="text-sm font-semibold mb-2">
        Notes (Optional)
      </p>
      <UTextarea
        v-model="txNotes"
        placeholder="Add details, store name, or description..."
        class="w-full"
      />
    </div>
  </AppModal>
</template>
