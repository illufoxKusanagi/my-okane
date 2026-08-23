<script setup lang="ts">
import AppModal from "~/components/ui/AppModal.vue";
import TransactionFilterBar from "~/components/transactions/TransactionFilterBar.vue";
import TransactionListItem from "~/components/transactions/TransactionListItem.vue";
import { useTransactionsController } from "./useTransactionsController";

const {
  categories,
  isScanning,
  fileInput,
  isMobile,
  triggerFileSelect,
  onFileSelected,
  searchQuery,
  selectedType,
  selectedCategoryId,
  isModalOpen,
  editingTransaction,
  txName,
  txType,
  txAmount,
  txCategoryId,
  txNotes,
  isDeleteConfirmOpen,
  transactionToDelete,
  formCategories,
  filteredTransactions,
  openAddModal,
  handleSaveTransaction,
  openEditModal,
  confirmDeleteTransaction,
  handleDeleteConfirm,
} = useTransactionsController();
</script>

<template>
  <div>
    <!-- Hidden file input for OCR scanning -->
    <input
      type="file"
      ref="fileInput"
      accept="image/*"
      class="hidden"
      :capture="isMobile ? 'environment' : undefined"
      @change="onFileSelected"
    />

    <UDashboardGroup>
      <SideSidebar />
      <UDashboardPanel>
        <UDashboardNavbar title="Transactions">
          <template #right>
            <div class="flex items-center gap-2">
              <UButton
                icon="i-lucide-camera"
                color="neutral"
                variant="outline"
                @click="triggerFileSelect"
              >
                <span class="sr-only sm:not-sr-only">Scan Receipt</span>
              </UButton>
              <UButton
                icon="i-lucide-plus"
                color="primary"
                @click="openAddModal"
              >
                <span class="sr-only sm:not-sr-only">Add Transaction</span>
              </UButton>
              <ColorModeButton />
            </div>
          </template>
        </UDashboardNavbar>

        <div class="h-full overflow-auto p-4">
          <UContainer class="py-6 flex flex-col gap-6 w-full">
            <!-- Filters Row -->
            <TransactionFilterBar
              v-model:search-query="searchQuery"
              v-model:selected-type="selectedType"
              v-model:selected-category-id="selectedCategoryId"
              :categories="categories"
            />

            <!-- Transactions List -->
            <div
              v-if="filteredTransactions.length > 0"
              class="flex flex-col gap-3"
            >
              <TransactionListItem
                v-for="tx in filteredTransactions"
                :key="tx.id"
                :transaction="tx"
                @edit="openEditModal(tx)"
                @delete="confirmDeleteTransaction(tx)"
              />
            </div>

            <!-- Empty State -->
            <div
              v-else
              class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/10"
            >
              <UIcon
                name="i-lucide-arrow-right-left"
                class="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3"
              />
              <p class="font-semibold text-neutral-700 dark:text-neutral-300">
                No transactions found
              </p>
              <p
                class="text-sm text-neutral-500 dark:text-neutral-500 mt-1 mb-4"
              >
                Try adjusting your filters or add a new transaction
              </p>
              <UButton
                label="Add Transaction"
                icon="i-lucide-plus"
                size="sm"
                @click="openAddModal"
              />
            </div>
          </UContainer>
        </div>

        <!-- Create/Edit Modal -->
        <AppModal
          v-model:open="isModalOpen"
          :title="editingTransaction ? 'Edit Transaction' : 'Add Transaction'"
          :submit-label="editingTransaction ? 'Save Changes' : 'Create'"
          @submit="handleSaveTransaction"
        >
          <div>
            <p class="text-sm font-semibold mb-2">Transaction Name</p>
            <UInput
              v-model="txName"
              placeholder="e.g. Lunch at McD, Monthly Salary"
              class="w-full"
              autofocus
            />
          </div>

          <div>
            <p class="text-sm font-semibold mb-2">Transaction Type</p>
            <USelect
              v-model="txType"
              :items="[
                { label: 'Spending', value: 'spending' },
                { label: 'Income', value: 'income' },
              ]"
              class="w-full"
            />
          </div>

          <div>
            <p class="text-sm font-semibold mb-2">Category</p>
            <USelect
              v-model="txCategoryId"
              :items="
                formCategories.map((c) => ({ label: c.name, value: c.id }))
              "
              class="w-full"
              placeholder="Select category"
            />
          </div>

          <div>
            <p class="text-sm font-semibold mb-2">Amount</p>
            <UInputNumber
              class="w-full"
              v-model="txAmount"
              :format-options="{
                style: 'currency',
                currency: 'IDR',
                currencyDisplay: 'code',
                currencySign: 'accounting',
              }"
            />
          </div>

          <div>
            <p class="text-sm font-semibold mb-2">Notes (Optional)</p>
            <UTextarea
              v-model="txNotes"
              placeholder="Add details, store name, or description..."
              class="w-full"
            />
          </div>
        </AppModal>

        <!-- Delete Confirmation Modal -->
        <AppModal
          v-model:open="isDeleteConfirmOpen"
          title="Delete Transaction?"
          submit-label="Delete"
          @submit="handleDeleteConfirm"
        >
          <div class="flex items-center gap-3 text-error mb-2">
            <UIcon name="i-lucide-triangle-alert" class="w-6 h-6" />
            <span class="font-semibold">Warning: Irreversible Action</span>
          </div>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Are you sure you want to delete this transaction for <strong>{{ transactionToDelete?.name }}</strong>?
            This action cannot be undone.
          </p>
        </AppModal>

        <!-- Scanning Loading Overlay -->
        <UModal v-model:open="isScanning" prevent-close>
          <template #content>
            <div class="flex flex-col items-center justify-center p-8 gap-4">
              <UIcon
                name="i-lucide-loader-2"
                class="w-12 h-12 text-primary animate-spin"
              />
              <p class="font-semibold text-neutral-850 dark:text-neutral-100">
                Scanning receipt image...
              </p>
              <p class="text-sm text-neutral-500">
                Parsing items and finding best category matches with Gemini AI
              </p>
            </div>
          </template>
        </UModal>
      </UDashboardPanel>
    </UDashboardGroup>
  </div>
</template>
