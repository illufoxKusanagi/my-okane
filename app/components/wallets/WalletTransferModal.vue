<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppModal from '~/components/ui/AppModal.vue'
import CurrencyInput from '~/components/ui/CurrencyInput.vue'

const isOpen = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  transferred: []
}>()

const { wallets, transferFunds } = useWallets()
const { formatCurrency, toDateInputValue } = useFormatters()

const isSaving = ref(false)
const sourceWalletId = ref('')
const targetWalletId = ref('')
const amount = ref(0)
const notes = ref('')
const date = ref(toDateInputValue(new Date()))

watch(
  isOpen,
  (open) => {
    if (open) {
      if (wallets.value.length >= 1 && !sourceWalletId.value) {
        sourceWalletId.value = wallets.value[0]?.id || ''
      }
      if (wallets.value.length >= 2 && (!targetWalletId.value || targetWalletId.value === sourceWalletId.value)) {
        const next = wallets.value.find(w => w.id !== sourceWalletId.value)
        targetWalletId.value = next?.id || ''
      }
      amount.value = 0
      notes.value = ''
      date.value = toDateInputValue(new Date())
    }
  },
  { immediate: true }
)

const sourceOptions = computed(() =>
  wallets.value.map(w => ({
    label: `${w.name} (${formatCurrency(w.balance)})`,
    value: w.id
  }))
)

const targetOptions = computed(() =>
  wallets.value
    .filter(w => w.id !== sourceWalletId.value)
    .map(w => ({
      label: `${w.name} (${formatCurrency(w.balance)})`,
      value: w.id
    }))
)

watch(sourceWalletId, (newSource) => {
  if (targetWalletId.value === newSource) {
    const alternative = wallets.value.find(w => w.id !== newSource)
    targetWalletId.value = alternative?.id || ''
  }
})

const isInvalid = computed(
  () =>
    !sourceWalletId.value
    || !targetWalletId.value
    || sourceWalletId.value === targetWalletId.value
    || !(amount.value > 0)
    || !date.value
)

const handleTransfer = async () => {
  if (isInvalid.value || isSaving.value) return
  isSaving.value = true
  try {
    await transferFunds({
      sourceWalletId: sourceWalletId.value,
      targetWalletId: targetWalletId.value,
      amount: amount.value,
      notes: notes.value.trim() || null,
      date: date.value
    })
    emit('transferred')
    isOpen.value = false
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <AppModal
    v-model:open="isOpen"
    :title="$t('wallets.transferTitle')"
    :submit-label="$t('wallets.transfer')"
    :loading="isSaving"
    :disabled="isInvalid"
    @submit="handleTransfer"
  >
    <div class="flex flex-col gap-4">
      <UFormField
        :label="$t('wallets.sourceAccount')"
        required
      >
        <USelect
          v-model="sourceWalletId"
          :items="sourceOptions"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="$t('wallets.targetAccount')"
        required
      >
        <USelect
          v-model="targetWalletId"
          :items="targetOptions"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="$t('wallets.transferAmount')"
        required
      >
        <CurrencyInput v-model="amount" />
      </UFormField>

      <UFormField
        :label="$t('transactions.fields.date')"
        required
      >
        <UInput
          v-model="date"
          type="date"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="$t('wallets.transferNotes')">
        <UInput
          v-model="notes"
          :placeholder="$t('wallets.transferNotesPlaceholder')"
          class="w-full"
        />
      </UFormField>
    </div>
  </AppModal>
</template>
