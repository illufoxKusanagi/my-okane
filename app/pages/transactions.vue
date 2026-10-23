<script setup lang="ts">
import DeleteConfirmModal from '~/components/ui/DeleteConfirmModal.vue'
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
  txDate,
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
  <div class="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 sm:p-6 lg:p-8 pb-12 sm:pb-8">
    <!-- Header with Action Buttons -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-highlighted">
          Transactions
        </h1>
        <p class="text-xs sm:text-sm text-muted">
          Manage and track your income and expenses
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-camera"
          color="neutral"
          variant="outline"
          aria-label="Scan receipt"
          @click="triggerFileSelect"
        >
          <span class="sr-only sm:not-sr-only">Scan Receipt</span>
        </UButton>
        <UButton
          icon="i-lucide-plus"
          color="primary"
          aria-label="Add transaction"
          @click="openAddModal"
        >
          <span class="sr-only sm:not-sr-only">Add Transaction</span>
        </UButton>
      </div>
    </div>

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
      aria-busy="true"
      aria-label="Loading transactions"
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
        class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-muted"
      >
        <p class="text-xs text-muted">
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
      class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-muted rounded-2xl bg-muted/20"
    >
      <UIcon
        name="i-lucide-arrow-right-left"
        class="w-12 h-12 text-muted mb-3"
      />
      <p class="font-semibold text-highlighted">
        No transactions found
      </p>
      <p
        class="text-sm text-muted mt-1 mb-4"
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

    <!-- Hidden file input for OCR scanning -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      aria-hidden="true"
      tabindex="-1"
      :capture="isMobile ? 'environment' : undefined"
      @change="onFileSelected"
    >

    <!-- Create/Edit Modal -->
    <TransactionFormModal
      v-model:open="isModalOpen"
      v-model:name="txName"
      v-model:type="txType"
      v-model:amount="txAmount"
      v-model:category-id="txCategoryId"
      v-model:notes="txNotes"
      v-model:date="txDate"
      :editing-transaction="editingTransaction"
      :categories="formCategories"
      @submit="handleSaveTransaction"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      v-model:open="isDeleteConfirmOpen"
      title="Delete Transaction?"
      @confirm="handleDeleteConfirm"
    >
      Are you sure you want to delete this transaction for
      <strong>{{ transactionToDelete?.name }}</strong>?
      This action cannot be undone.
    </DeleteConfirmModal>

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
          <p class="font-semibold text-highlighted">
            Scanning receipt image...
          </p>
          <p class="text-sm text-muted">
            Parsing items and finding best category matches with Gemini AI
          </p>
        </div>
      </template>
    </UModal>
  </div>
</template>
