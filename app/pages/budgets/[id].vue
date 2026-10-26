<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import AppModal from '~/components/ui/AppModal.vue'
import DeleteConfirmModal from '~/components/ui/DeleteConfirmModal.vue'
import TransactionFormFields from '~/components/transactions/TransactionFormFields.vue'
import PocketHeroCard from '~/components/budgets/PocketHeroCard.vue'
import PocketStatsCard from '~/components/budgets/PocketStatsCard.vue'
import TransactionListItem from '~/components/transactions/TransactionListItem.vue'
import CurrencyInput from '~/components/ui/CurrencyInput.vue'
import { usePocketDetailsController } from './usePocketDetailsController'

const route = useRoute()
const router = useRouter()
const categoryId = String(route.params.id)

const {
  currentMonth,
  pocket,
  pocketTransactions,
  pocketNumber,
  pending,
  isSaving,
  isBudgetModalOpen,
  budgetAmount,
  isTxModalOpen,
  txName,
  txAmount,
  txNotes,
  txDate,
  editingTx,
  isDeleteConfirmOpen,
  txToDelete,
  openBudgetModal,
  handleSaveBudget,
  handleDeleteBudget,
  openTxModal,
  handleSaveTransaction,
  confirmDeleteTx,
  handleDeleteConfirm
} = usePocketDetailsController(categoryId)

const { formatMonthLabel } = useFormatters()

useSeoMeta({
  title: () => pocket.value ? `${pocket.value.name} Pocket` : 'Pocket Details'
})
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6 lg:p-8 pb-12 sm:pb-8"
  >
    <!-- Header with Back Button -->
    <div class="flex items-center gap-3">
      <UButton
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        aria-label="Back to budgets"
        @click="navigateTo('/budgets')"
      />
      <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-highlighted">
        Pocket Details
      </h1>
    </div>

    <!-- Loading Skeletons -->
    <div
      v-if="pending"
      class="flex flex-col gap-6 w-full"
    >
      <USkeleton class="h-64 rounded-3xl w-full" />
      <USkeleton class="h-24 rounded-2xl w-full" />
      <div class="flex flex-col gap-3 mt-2">
        <USkeleton class="h-5 w-40 rounded-md" />
        <USkeleton
          v-for="i in 3"
          :key="`tx-skel-${i}`"
          class="h-20 rounded-2xl w-full"
        />
      </div>
    </div>

    <!-- Loaded Pocket Content -->
    <div
      v-else-if="pocket"
      class="flex flex-col gap-6 w-full"
    >
      <PocketHeroCard
        :pocket="pocket"
        :pocket-number="pocketNumber"
        @add-transaction="openTxModal()"
        @set-budget="openBudgetModal"
        @reset-budget="handleDeleteBudget"
      />

      <!-- Stats Sub-details -->
      <PocketStatsCard
        :budget-amount="pocket.budgetAmount"
        :type="pocket.type === 'income' ? 'income' : 'spending'"
        :spent="pocket.spent"
        :earned="pocket.earned"
      />

      <!-- Transaction History Listing -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <span
            class="text-sm font-black uppercase tracking-wider text-neutral-400"
          >
            Transactions ({{ formatMonthLabel(currentMonth) }})
          </span>
          <span class="text-xs text-muted font-mono">
            {{ pocketTransactions.length }} items
          </span>
        </div>

        <!-- List -->
        <div
          v-if="pocketTransactions.length > 0"
          class="flex flex-col gap-3"
        >
          <TransactionListItem
            v-for="tx in pocketTransactions"
            :key="tx.id"
            :transaction="tx"
            :color="pocket.color || undefined"
            :icon="pocket.icon || undefined"
            @edit="openTxModal(tx)"
            @delete="confirmDeleteTx(tx)"
          />
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="flex flex-col items-center justify-center p-12 border border-dashed border-muted rounded-3xl text-center bg-white/20 dark:bg-neutral-900/10"
        >
          <UIcon
            name="i-lucide-receipt"
            class="w-8 h-8 text-neutral-400 mb-2"
          />
          <p class="text-sm font-semibold text-muted">
            No transactions in this pocket for
            {{ formatMonthLabel(currentMonth) }}.
          </p>
        </div>
      </div>
    </div>

    <!-- Not Found State -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-20 w-full border border-dashed border-muted rounded-3xl text-center bg-white/30 dark:bg-neutral-900/20"
    >
      <UIcon
        name="i-lucide-folder-x"
        class="w-12 h-12 text-neutral-400 mb-3"
      />
      <h3 class="text-lg font-bold text-highlighted">
        Pocket not found
      </h3>
      <p class="text-sm text-muted mt-1 mb-4">
        This pocket might have been deleted or does not exist.
      </p>
      <UButton
        label="Back to Budgets"
        icon="i-lucide-arrow-left"
        @click="router.push('/budgets')"
      />
    </div>

    <!-- Budget modal -->
    <AppModal
      v-model:open="isBudgetModalOpen"
      title="Configure Pocket Limit"
      submit-label="Save Limit"
      :loading="isSaving"
      @submit="handleSaveBudget"
    >
      <UFormField label="Limit Amount">
        <CurrencyInput
          v-model="budgetAmount"
          autofocus
        />
      </UFormField>
    </AppModal>

    <!-- Transaction modal -->
    <AppModal
      v-model:open="isTxModalOpen"
      :title="editingTx ? 'Edit Transaction' : 'Add Transaction'"
      submit-label="Save"
      :loading="isSaving"
      :disabled="!txName.trim() || !(txAmount > 0) || !txDate"
      @submit="handleSaveTransaction"
    >
      <TransactionFormFields
        v-model:name="txName"
        v-model:amount="txAmount"
        v-model:date="txDate"
        v-model:notes="txNotes"
      />
    </AppModal>

    <!-- Delete Transaction Confirmation -->
    <DeleteConfirmModal
      v-model:open="isDeleteConfirmOpen"
      title="Delete Transaction?"
      :loading="isSaving"
      @confirm="handleDeleteConfirm"
    >
      Are you sure you want to delete
      <strong>{{ txToDelete?.name }}</strong>? This action cannot be undone.
    </DeleteConfirmModal>
  </div>
</template>
