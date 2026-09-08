<script setup lang="ts">
import AppModal from '~/components/ui/AppModal.vue'
import TransactionFilterBar from '~/components/transactions/TransactionFilterBar.vue'
import TransactionListItem from '~/components/transactions/TransactionListItem.vue'
import { useTransactionsController } from './useTransactionsController'

const {
  categories,
  isLoading,
  isScanning,
  fileInput,
  isMobile,
  triggerFileSelect,
  onFileSelected,
  searchQuery,
  selectedType,
  selectedCategoryId,
  currentPage,
  pageSize,
  hasActiveFilters,
  resetFilters,
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
  paginatedTransactions,
  openAddModal,
  handleSaveTransaction,
  openEditModal,
  confirmDeleteTransaction,
  handleDeleteConfirm
} = useTransactionsController()
</script>

<template>
  <div>
    <!-- Hidden file input for OCR scanning -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      :capture="isMobile ? 'environment' : undefined"
      @change="onFileSelected"
    >

    <UDashboardPanel>
      <UDashboardNavbar title="Transactions">
        <template #left>
          <UDashboardSidebarToggle />
        </template>
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

      <div class="h-full overflow-auto p-4 md:p-6">
        <UContainer class="flex flex-col gap-6 max-w-6xl">
          <!-- Filters Row -->
          <TransactionFilterBar
            v-model:search-query="searchQuery"
            v-model:selected-type="selectedType"
            v-model:selected-category-id="selectedCategoryId"
            :categories="categories"
            :has-active-filters="hasActiveFilters"
            @reset="resetFilters"
          />

          <!-- Transactions List / Skeletons -->
          <div
            v-if="isLoading"
            class="flex flex-col gap-3"
          >
            <USkeleton
              v-for="i in 5"
              :key="`tx-page-skel-${i}`"
              class="h-20 rounded-2xl w-full"
            />
          </div>

          <div
            v-else-if="filteredTransactions.length > 0"
            class="flex flex-col gap-4"
          >
            <div class="flex flex-col gap-3">
              <TransactionListItem
                v-for="tx in paginatedTransactions"
                :key="tx.id"
                :transaction="tx"
                @edit="openEditModal(tx)"
                @delete="confirmDeleteTransaction(tx)"
              />
            </div>

            <!-- Pagination Controls -->
            <div
              v-if="filteredTransactions.length > pageSize"
              class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60"
            >
              <p class="text-xs text-neutral-500">
                Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredTransactions.length) }} of {{ filteredTransactions.length }} transactions
              </p>
              <UPagination
                v-model:page="currentPage"
                :items-per-page="pageSize"
                :total="filteredTransactions.length"
              />
            </div>
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
      <TransactionFormModal
        v-model:open="isModalOpen"
        v-model:name="txName"
        v-model:type="txType"
        v-model:amount="txAmount"
        v-model:category-id="txCategoryId"
        v-model:notes="txNotes"
        :editing-transaction="editingTransaction"
        :categories="formCategories"
        @submit="handleSaveTransaction"
      />

      <!-- Delete Confirmation Modal -->
      <AppModal
        v-model:open="isDeleteConfirmOpen"
        title="Delete Transaction?"
        submit-label="Delete"
        @submit="handleDeleteConfirm"
      >
        <div class="flex items-center gap-3 text-error mb-2">
          <UIcon
            name="i-lucide-triangle-alert"
            class="w-6 h-6"
          />
          <span class="font-semibold">Warning: Irreversible Action</span>
        </div>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">
          Are you sure you want to delete this transaction for <strong>{{ transactionToDelete?.name }}</strong>?
          This action cannot be undone.
        </p>
      </AppModal>

      <!-- Scanning Loading Overlay -->
      <UModal
        v-model:open="isScanning"
        :dismissible="false"
        title="Scanning receipt image"
        description="Parsing items and finding best category matches with Gemini AI"
      >
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
  </div>
</template>
