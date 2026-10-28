<script setup lang="ts">
import { computed, watch } from 'vue'
import type { Category, WalletWithBalance } from '~/composables/useFinance'
import CurrencyInput from '~/components/ui/CurrencyInput.vue'

const props = withDefaults(
  defineProps<{
    showType?: boolean
    showCategory?: boolean
    showWallet?: boolean
    categories?: Category[]
    wallets?: WalletWithBalance[]
  }>(),
  {
    showType: false,
    showCategory: false,
    showWallet: false,
    categories: () => [],
    wallets: undefined
  }
)

const name = defineModel<string>('name', { required: true })
const amount = defineModel<number>('amount', { required: true })
const notes = defineModel<string>('notes', { required: true })
const date = defineModel<string>('date', { required: true })
const type = defineModel<'income' | 'spending'>('type', {
  default: 'spending'
})
const categoryId = defineModel<string | undefined>('categoryId')
const walletId = defineModel<string | undefined>('walletId')

const { wallets: systemWallets } = useWallets()
const { formatCurrency } = useFormatters()

const availableWallets = computed(() => props.wallets ?? systemWallets.value)

const walletItems = computed(() =>
  availableWallets.value.map(w => ({
    label: `${w.name} (${formatCurrency(w.balance)})`,
    value: w.id
  }))
)

watch(
  availableWallets,
  (list) => {
    if (!walletId.value && list.length > 0) {
      const def = list.find(w => w.isDefault) || list[0]
      if (def) walletId.value = def.id
    }
  },
  { immediate: true }
)
</script>

<template>
  <UFormField :label="$t('transactions.fields.name')">
    <UInput
      v-model="name"
      :placeholder="$t('transactions.fields.namePlaceholder')"
      class="w-full"
      autofocus
    />
  </UFormField>

  <UFormField
    v-if="showType"
    :label="$t('transactions.fields.type')"
  >
    <USelect
      v-model="type"
      class="w-full"
      :items="[
        { label: $t('transactions.spending'), value: 'spending' },
        { label: $t('transactions.income'), value: 'income' }
      ]"
    />
  </UFormField>

  <UFormField
    v-if="showCategory"
    :label="$t('transactions.fields.category')"
  >
    <USelect
      v-model="categoryId"
      class="w-full"
      :items="categories.map((c) => ({ label: c.name, value: c.id }))"
      :placeholder="$t('transactions.fields.selectCategory')"
    />
  </UFormField>

  <UFormField
    v-if="showWallet && availableWallets.length > 0"
    :label="$t('wallets.name')"
  >
    <USelect
      v-model="walletId"
      class="w-full"
      :items="walletItems"
      :placeholder="$t('wallets.namePlaceholder')"
    />
  </UFormField>

  <UFormField :label="$t('transactions.fields.amount')">
    <CurrencyInput v-model="amount" />
  </UFormField>

  <UFormField :label="$t('transactions.fields.date')">
    <UInput
      v-model="date"
      type="date"
      class="w-full"
    />
  </UFormField>

  <UFormField :label="$t('transactions.fields.notes')">
    <UTextarea
      v-model="notes"
      :placeholder="$t('transactions.fields.notesPlaceholder')"
      class="w-full"
    />
  </UFormField>
</template>
