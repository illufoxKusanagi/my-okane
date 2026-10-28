<script setup lang="ts">
import { computed } from 'vue'
import type { WalletWithBalance } from '~/composables/finance/types'

const props = withDefaults(
  defineProps<{
    wallet: WalletWithBalance
    canDelete?: boolean
  }>(),
  {
    canDelete: true
  }
)

const emit = defineEmits<{
  edit: [wallet: WalletWithBalance]
  delete: [wallet: WalletWithBalance]
  setDefault: [wallet: WalletWithBalance]
}>()

const { formatCurrency } = useFormatters()
const { t } = useI18n()

const colorGradients: Record<string, string> = {
  emerald: 'from-emerald-600 via-emerald-700 to-teal-900',
  blue: 'from-blue-600 via-blue-700 to-indigo-900',
  indigo: 'from-indigo-600 via-indigo-700 to-violet-950',
  violet: 'from-violet-600 via-purple-700 to-fuchsia-950',
  rose: 'from-rose-600 via-pink-700 to-red-950',
  amber: 'from-amber-500 via-amber-600 to-orange-900',
  slate: 'from-slate-700 via-slate-800 to-zinc-950'
}

const gradientClass = computed(
  () => colorGradients[props.wallet.color] || colorGradients.emerald
)

const maskedNumber = computed(() => {
  const digits = props.wallet.accountNumber?.trim()
  if (!digits) return '•••• •••• •••• ••••'
  const last4 = digits.length > 4 ? digits.slice(-4) : digits.padStart(4, '0')
  return `•••• •••• •••• ${last4}`
})

interface MenuItem {
  label: string
  icon: string
  color?: 'error' | 'primary' | 'neutral'
  onSelect: () => void
}

const menuItems = computed<MenuItem[][]>(() => {
  const actions: MenuItem[] = [
    {
      label: t('wallets.editAccount'),
      icon: 'i-lucide-pencil',
      onSelect: () => emit('edit', props.wallet)
    }
  ]

  if (!props.wallet.isDefault) {
    actions.push({
      label: t('wallets.setAsDefault'),
      icon: 'i-lucide-star',
      onSelect: () => emit('setDefault', props.wallet)
    })
  }

  const items: MenuItem[][] = [actions]

  if (props.canDelete) {
    items.push([
      {
        label: t('wallets.deleteAccount'),
        icon: 'i-lucide-trash-2',
        color: 'error',
        onSelect: () => emit('delete', props.wallet)
      }
    ])
  }

  return items
})
</script>

<template>
  <div
    :class="[
      'h-48 sm:h-52 w-72 sm:w-80 shrink-0 rounded-3xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between text-white snap-start bg-gradient-to-br transition-all duration-300 hover:shadow-xl hover:scale-[1.01]',
      gradientClass
    ]"
  >
    <!-- Background Sheen Decoration -->
    <div
      class="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none"
    />
    <div
      class="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-black/15 blur-lg pointer-events-none"
    />

    <!-- Header: Chip, Contactless & Action Menu -->
    <div class="flex items-start justify-between z-10">
      <div class="flex items-center gap-3">
        <!-- Metallic Smart Chip -->
        <div
          class="w-9 h-7 rounded-md bg-gradient-to-tr from-amber-300 via-yellow-100 to-amber-400 border border-amber-500/50 shadow-inner flex items-center justify-center relative overflow-hidden"
        >
          <div
            class="grid grid-cols-2 gap-0.5 w-6 h-4 opacity-40 border border-amber-900/40 rounded-xs"
          />
        </div>
        <!-- Contactless Icon -->
        <UIcon
          name="i-lucide-wifi"
          class="rotate-90 text-white/70 size-4.5"
        />
      </div>

      <div class="flex items-center gap-1.5">
        <span
          v-if="wallet.isDefault"
          class="bg-amber-400/25 border border-amber-300/40 text-amber-200 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1"
        >
          {{ $t('wallets.default') }}
        </span>
        <UDropdownMenu
          :items="menuItems"
          :content="{ align: 'end' }"
        >
          <UButton
            icon="i-lucide-more-vertical"
            variant="ghost"
            color="neutral"
            size="xs"
            class="text-white/80 hover:text-white hover:bg-white/10 rounded-full"
            :aria-label="$t('common.edit')"
          />
        </UDropdownMenu>
      </div>
    </div>

    <!-- Body: Balance & Masked Card Number -->
    <div class="flex flex-col gap-1 z-10 my-auto">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-white/75 uppercase tracking-wider">
          {{ $t('wallets.balance') }}
        </span>
        <span
          class="bg-white/15 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-medium text-white/90 border border-white/20"
        >
          {{ $t(`wallets.types.${wallet.type}`) }}
        </span>
      </div>
      <p class="text-xl sm:text-2xl font-black tracking-tight text-white tabular-nums drop-shadow-xs">
        {{ formatCurrency(wallet.balance) }}
      </p>
      <p class="font-mono text-xs sm:text-sm tracking-widest text-white/80 mt-1">
        {{ maskedNumber }}
      </p>
    </div>

    <!-- Footer: Account Name -->
    <div class="flex items-center justify-between z-10 pt-1">
      <p class="text-xs sm:text-sm font-bold tracking-wide uppercase truncate text-white/90 max-w-[220px]">
        {{ wallet.name }}
      </p>
      <UIcon
        :name="wallet.icon || 'i-lucide-credit-card'"
        class="size-5 text-white/60"
      />
    </div>
  </div>
</template>
