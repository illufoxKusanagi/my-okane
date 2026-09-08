<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import AppModal from '~/components/ui/AppModal.vue'
import PocketHeroCard from '~/components/budgets/PocketHeroCard.vue'
import TransactionListItem from '~/components/transactions/TransactionListItem.vue'
import { usePocketDetailsController } from './usePocketDetailsController'

const route = useRoute()
const router = useRouter()
const categoryId = Number(route.params.id)

const {
  currentMonth,
  pocket,
  pocketTransactions,
  pocketNumber,
  pending,
  isBudgetModalOpen,
  budgetAmount,
  isTxModalOpen,
  txName,
  txAmount,
  txNotes,
  editingTx,
  openBudgetModal,
  handleSaveBudget,
  handleDeleteBudget,
  openTxModal,
  handleSaveTransaction,
  handleDeleteTx
} = usePocketDetailsController(categoryId)

const { formatCurrency, formatMonthLabel } = useFormatters()
</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Pocket Details">
      <template #left>
        <div class="flex items-center gap-2">
          <UDashboardSidebarToggle />
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            aria-label="Back to budgets"
            @click="navigateTo('/budgets')"
          />
        </div>
      </template>
      <template #right>
        <ColorModeButton />
      </template>
    </UDashboardNavbar>

    <div class="h-full overflow-auto p-4 md:p-6">
      <!-- Loading Skeletons -->
      <UContainer
        v-if="pending"
        class="flex flex-col gap-6 max-w-2xl mx-auto"
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
      </UContainer>

      <!-- Loaded Pocket Content -->
      <UContainer
        v-else-if="pocket"
        class="flex flex-col gap-6 max-w-2xl mx-auto"
      >
        <PocketHeroCard
          :pocket="pocket"
          :pocket-number="pocketNumber"
          @add-transaction="openTxModal()"
          @set-budget="openBudgetModal"
          @reset-budget="handleDeleteBudget"
        />

        <!-- Stats Sub-details -->
        <div
          class="grid grid-cols-2 gap-4 bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 p-5 rounded-2xl shadow-sm backdrop-blur-md"
        >
          <div>
            <p class="text-xs text-neutral-500">
              Budget Limit
            </p>
            <p class="text-lg font-black text-neutral-850 dark:text-neutral-100">
              {{
                pocket.budgetAmount > 0
                  ? formatCurrency(pocket.budgetAmount)
                  : "No Limit Set"
              }}
            </p>
          </div>
          <div>
            <p class="text-xs text-neutral-500">
              {{ pocket.type === "spending" ? "Total Spent" : "Total Income" }}
            </p>
            <p
              :class="[
                'text-lg font-black',
                pocket.type === 'spending' ? 'text-rose-500' : 'text-emerald-500'
              ]"
            >
              {{
                pocket.type === "spending"
                  ? formatCurrency(pocket.spent)
                  : formatCurrency(pocket.earned)
              }}
            </p>
          </div>
        </div>

        <!-- Transaction History Listing -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span
              class="text-sm font-black uppercase tracking-wider text-neutral-400"
            >
              Transactions ({{ formatMonthLabel(currentMonth) }})
            </span>
            <span class="text-xs text-neutral-500 font-mono">
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
              @delete="handleDeleteTx(tx.id)"
            />
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="flex flex-col items-center justify-center p-12 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl text-center bg-white/20 dark:bg-neutral-900/10"
          >
            <UIcon
              name="i-lucide-receipt"
              class="w-8 h-8 text-neutral-400 mb-2"
            />
            <p class="text-sm font-semibold text-neutral-500">
              No transactions in this pocket for
              {{ formatMonthLabel(currentMonth) }}.
            </p>
          </div>
        </div>
      </UContainer>

      <!-- Not Found State -->
      <UContainer
        v-else
        class="flex flex-col items-center justify-center py-20 max-w-2xl mx-auto border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl text-center bg-white/30 dark:bg-neutral-900/20"
      >
        <UIcon
          name="i-lucide-folder-x"
          class="w-12 h-12 text-neutral-400 mb-3"
        />
        <h3 class="text-lg font-bold text-neutral-800 dark:text-neutral-200">
          Pocket not found
        </h3>
        <p class="text-sm text-neutral-500 mt-1 mb-4">
          This pocket might have been deleted or does not exist.
        </p>
        <UButton
          label="Back to Budgets"
          icon="i-lucide-arrow-left"
          @click="router.push('/budgets')"
        />
      </UContainer>
    </div>

    <!-- Budget modal -->
    <AppModal
      v-model:open="isBudgetModalOpen"
      title="Configure Pocket Limit"
      submit-label="Save Limit"
      @submit="handleSaveBudget"
    >
      <div>
        <p class="text-sm font-semibold mb-2">
          Limit Amount
        </p>
        <UInput
          v-model="budgetAmount"
          type="number"
          placeholder="e.g. 1000000"
          class="w-full"
          autofocus
        />
      </div>
    </AppModal>

    <!-- Transaction modal -->
    <AppModal
      v-model:open="isTxModalOpen"
      :title="editingTx ? 'Edit Transaction' : 'Add Transaction'"
      submit-label="Save"
      @submit="handleSaveTransaction"
    >
      <div>
        <p class="text-sm font-semibold mb-2">
          Name / Description
        </p>
        <UInput
          v-model="txName"
          placeholder="e.g. Coffee, Indomaret, Salary"
          class="w-full"
          autofocus
        />
      </div>
      <div>
        <p class="text-sm font-semibold mb-2">
          Amount (IDR)
        </p>
        <UInput
          v-model="txAmount"
          type="number"
          placeholder="e.g. 50000"
          class="w-full"
        />
      </div>
      <div>
        <p class="text-sm font-semibold mb-2">
          Notes (Optional)
        </p>
        <UInput
          v-model="txNotes"
          placeholder="Add some details..."
          class="w-full"
        />
      </div>
    </AppModal>
  </UDashboardPanel>
</template>
