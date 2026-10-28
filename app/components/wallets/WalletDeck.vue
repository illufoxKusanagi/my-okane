<script setup lang="ts">
import { ref, onMounted } from 'vue'
import WalletCard from './WalletCard.vue'
import WalletModal from './WalletModal.vue'
import WalletTransferModal from './WalletTransferModal.vue'
import DeleteConfirmModal from '~/components/ui/DeleteConfirmModal.vue'
import type { WalletWithBalance } from '~/composables/finance/types'

defineProps<{
  loading?: boolean
}>()

const { wallets, totalNetWorth, fetchWallets, updateWallet, deleteWallet }
  = useWallets()

const { formatCurrency } = useFormatters()

onMounted(() => {
  fetchWallets()
})

const isWalletModalOpen = ref(false)
const editingWallet = ref<WalletWithBalance | null>(null)

const isTransferModalOpen = ref(false)

const isDeleteModalOpen = ref(false)
const walletToDelete = ref<WalletWithBalance | null>(null)
const isDeleting = ref(false)

const openCreateWalletModal = () => {
  editingWallet.value = null
  isWalletModalOpen.value = true
}

const openEditWalletModal = (wallet: WalletWithBalance) => {
  editingWallet.value = wallet
  isWalletModalOpen.value = true
}

const confirmDeleteWallet = (wallet: WalletWithBalance) => {
  walletToDelete.value = wallet
  isDeleteModalOpen.value = true
}

const handleDeleteWallet = async () => {
  if (!walletToDelete.value || isDeleting.value) return
  isDeleting.value = true
  try {
    await deleteWallet(walletToDelete.value.id)
    isDeleteModalOpen.value = false
    walletToDelete.value = null
  } finally {
    isDeleting.value = false
  }
}

const handleSetDefault = async (wallet: WalletWithBalance) => {
  await updateWallet(wallet.id, { isDefault: true })
}
</script>

<template>
  <div class="flex flex-col gap-3.5 w-full">
    <!-- Header: Title & Quick Actions -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-credit-card"
            class="size-5 text-primary"
          />
          <h3 class="text-xl font-bold tracking-tight text-highlighted">
            {{ $t("wallets.title") }}
          </h3>
        </div>
        <p class="text-xs text-muted mt-0.5">
          {{ $t("wallets.netWorth") }}:
          <span class="font-semibold text-highlighted tabular-nums">{{
            formatCurrency(totalNetWorth)
          }}</span>
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          v-if="wallets.length >= 2"
          icon="i-lucide-arrow-left-right"
          color="neutral"
          variant="outline"
          size="sm"
          :aria-label="$t('wallets.transfer')"
          @click="isTransferModalOpen = true"
        >
          <span>{{ $t("wallets.transfer") }}</span>
        </UButton>
        <UButton
          icon="i-lucide-plus"
          color="primary"
          size="sm"
          :aria-label="$t('wallets.addAccount')"
          @click="openCreateWalletModal"
        >
          <span>{{ $t("wallets.addAccount") }}</span>
        </UButton>
      </div>
    </div>

    <!-- Horizontal Snap-Scroll Card Deck -->
    <div
      v-if="loading"
      class="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <USkeleton
        v-for="i in 2"
        :key="`wallet-skel-${i}`"
        class="h-48 sm:h-52 w-72 sm:w-80 shrink-0 rounded-3xl"
      />
    </div>

    <div
      v-else
      class="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <WalletCard
        v-for="wallet in wallets"
        :key="wallet.id"
        :wallet="wallet"
        :can-delete="wallets.length > 1"
        @edit="openEditWalletModal"
        @delete="confirmDeleteWallet"
        @set-default="handleSetDefault"
      />

      <!-- "+ Add Card" Dashed Placeholder Card -->
      <button
        type="button"
        class="h-48 sm:h-52 w-72 sm:w-80 shrink-0 rounded-3xl border-2 border-dashed border-muted hover:border-primary/60 bg-muted/10 hover:bg-muted/20 transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer snap-start text-muted hover:text-highlighted focus-visible:ring-2 focus-visible:ring-primary"
        :aria-label="$t('wallets.addAccount')"
        @click="openCreateWalletModal"
      >
        <div
          class="size-11 rounded-full bg-elevated border border-muted/60 flex items-center justify-center text-primary shadow-xs"
        >
          <UIcon
            name="i-lucide-plus"
            class="size-5"
          />
        </div>
        <span class="text-sm font-semibold">{{
          $t("wallets.addAccount")
        }}</span>
      </button>
    </div>

    <!-- Modals -->
    <WalletModal
      v-model:open="isWalletModalOpen"
      :wallet="editingWallet"
      @saved="fetchWallets(true)"
    />

    <WalletTransferModal
      v-model:open="isTransferModalOpen"
      @transferred="fetchWallets(true)"
    />

    <DeleteConfirmModal
      v-model:open="isDeleteModalOpen"
      :title="$t('wallets.deleteAccount')"
      :loading="isDeleting"
      @confirm="handleDeleteWallet"
    >
      {{ $t("wallets.deleteAccountConfirm", { name: walletToDelete?.name }) }}
    </DeleteConfirmModal>
  </div>
</template>
