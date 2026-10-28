<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppModal from '~/components/ui/AppModal.vue'
import CurrencyInput from '~/components/ui/CurrencyInput.vue'
import type {
  WalletWithBalance,
  WalletType
} from '~/composables/finance/types'

const isOpen = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  wallet: WalletWithBalance | null
}>()

const emit = defineEmits<{
  saved: [wallet: WalletWithBalance]
}>()

const { createWallet, updateWallet } = useWallets()

const isSaving = ref(false)
const formName = ref('')
const formType = ref<WalletType>('bank')
const formAccountNumber = ref('')
const formInitialBalance = ref(0)
const formColor = ref('emerald')
const formIsDefault = ref(false)

const colorOptions = [
  'emerald',
  'blue',
  'indigo',
  'violet',
  'rose',
  'amber',
  'slate'
]
const colorBgClasses: Record<string, string> = {
  emerald: 'bg-emerald-600',
  blue: 'bg-blue-600',
  indigo: 'bg-indigo-600',
  violet: 'bg-violet-600',
  rose: 'bg-rose-600',
  amber: 'bg-amber-500',
  slate: 'bg-slate-700'
}

const defaultTypeIcons: Record<WalletType, string> = {
  bank: 'i-lucide-building-2',
  cash: 'i-lucide-banknote',
  ewallet: 'i-lucide-smartphone',
  savings: 'i-lucide-piggy-bank',
  credit: 'i-lucide-credit-card'
}

const typeItems = computed(() => [
  { label: $t('wallets.types.bank'), value: 'bank' },
  { label: $t('wallets.types.cash'), value: 'cash' },
  { label: $t('wallets.types.ewallet'), value: 'ewallet' },
  { label: $t('wallets.types.savings'), value: 'savings' },
  { label: $t('wallets.types.credit'), value: 'credit' }
])

const isEdit = computed(() => !!props.wallet)

watch(
  () => props.wallet,
  (w) => {
    if (w) {
      formName.value = w.name
      formType.value = w.type
      formAccountNumber.value = w.accountNumber || ''
      formInitialBalance.value = w.initialBalance || 0
      formColor.value = w.color || 'emerald'
      formIsDefault.value = w.isDefault
    } else {
      formName.value = ''
      formType.value = 'bank'
      formAccountNumber.value = ''
      formInitialBalance.value = 0
      formColor.value = 'emerald'
      formIsDefault.value = false
    }
  },
  { immediate: true }
)

const isAccountNumberInvalid = computed(() => {
  const val = formAccountNumber.value.trim()
  return val.length > 0 && val.length !== 4
})

const isInvalid = computed(
  () =>
    !formName.value.trim() || !formType.value || isAccountNumberInvalid.value
)

const handleSubmit = async () => {
  if (isInvalid.value || isSaving.value) return
  isSaving.value = true
  try {
    const icon = defaultTypeIcons[formType.value] || 'i-lucide-credit-card'
    if (isEdit.value && props.wallet) {
      const updated = await updateWallet(props.wallet.id, {
        name: formName.value.trim(),
        type: formType.value,
        accountNumber: formAccountNumber.value.trim() || null,
        initialBalance: formInitialBalance.value,
        color: formColor.value,
        icon,
        isDefault: formIsDefault.value
      })
      if (updated) emit('saved', updated)
    } else {
      const created = await createWallet({
        name: formName.value.trim(),
        type: formType.value,
        accountNumber: formAccountNumber.value.trim() || null,
        initialBalance: formInitialBalance.value,
        color: formColor.value,
        icon,
        isDefault: formIsDefault.value
      })
      if (created) emit('saved', created)
    }
    isOpen.value = false
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <AppModal
    v-model:open="isOpen"
    :title="isEdit ? $t('wallets.editTitle') : $t('wallets.createTitle')"
    :submit-label="isEdit ? $t('common.saveChanges') : $t('common.create')"
    :loading="isSaving"
    :disabled="isInvalid"
    @submit="handleSubmit"
  >
    <div class="flex flex-col gap-4">
      <UFormField
        :label="$t('wallets.name')"
        required
      >
        <UInput
          v-model="formName"
          :placeholder="$t('wallets.namePlaceholder')"
          class="w-full"
          autofocus
        />
      </UFormField>

      <UFormField
        :label="$t('wallets.type')"
        required
      >
        <USelect
          v-model="formType"
          :items="typeItems"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="$t('wallets.accountNumber')"
        :error="
          isAccountNumberInvalid ? $t('wallets.accountNumberHint') : undefined
        "
      >
        <UInput
          v-model="formAccountNumber"
          :placeholder="$t('wallets.accountNumberPlaceholder')"
          maxlength="4"
          inputmode="numeric"
          class="w-full font-mono"
          @input="
            (e: Event) =>
              (formAccountNumber = (e.target as HTMLInputElement).value
                .replace(/\D/g, '')
                .slice(0, 4))
          "
        />
      </UFormField>

      <UFormField :label="$t('wallets.initialBalance')">
        <CurrencyInput v-model="formInitialBalance" />
      </UFormField>

      <UFormField :label="$t('wallets.color')">
        <div class="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            v-for="color in colorOptions"
            :key="color"
            type="button"
            :class="[
              'size-7 rounded-full transition-all focus:outline-hidden cursor-pointer',
              colorBgClasses[color],
              formColor === color
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-elevated scale-110'
                : 'opacity-70 hover:opacity-100 hover:scale-105'
            ]"
            :aria-label="color"
            @click="formColor = color"
          />
        </div>
      </UFormField>

      <div class="pt-2 border-t border-muted/50">
        <label class="flex items-center justify-between cursor-pointer">
          <div class="flex flex-col">
            <span class="text-sm font-medium text-highlighted">{{
              $t("wallets.setAsDefault")
            }}</span>
            <span class="text-xs text-muted">{{
              $t("wallets.defaultAccountDesc")
            }}</span>
          </div>
          <USwitch v-model="formIsDefault" />
        </label>
      </div>
    </div>
  </AppModal>
</template>
