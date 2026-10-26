<script setup lang="ts">
import AppModal from '~/components/ui/AppModal.vue'
import CategoryFormFields from '~/components/categories/CategoryFormFields.vue'
import MonthlyLimitCard from '~/components/budgets/MonthlyLimitCard.vue'
import PocketCard from '~/components/budgets/PocketCard.vue'
import CurrencyInput from '~/components/ui/CurrencyInput.vue'
import { useBudgetsController } from './useBudgetsController'

useSeoMeta({
  title: 'Budgets'
})

const {
  currentMonth,
  budgetData,
  pending,
  isModalOpen,
  selectedCategoryId,
  budgetAmount,
  isCreatePocketModalOpen,
  pocketName,
  pocketType,
  pocketColor,
  pocketIcon,
  pocketBudgetLimit,
  openCreatePocketModal,
  handleCreatePocket,
  prevMonth,
  nextMonth,
  openBudgetModal,
  handleSaveBudget
} = useBudgetsController()

const { formatMonthLabel } = useFormatters()
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 sm:p-6 lg:p-8 pb-12 sm:pb-8"
  >
    <!-- Month Selection Header -->
    <div
      class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-elevated/70 border border-muted/50 p-5 rounded-2xl shadow-sm backdrop-blur-md"
    >
      <div class="flex items-center gap-3">
        <UButton
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="ghost"
          aria-label="Previous month"
          @click="prevMonth"
        />
        <span class="text-lg font-bold text-highlighted min-w-44 text-center">
          {{ formatMonthLabel(currentMonth) }}
        </span>
        <UButton
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="ghost"
          aria-label="Next month"
          @click="nextMonth"
        />
      </div>

      <div class="flex flex-col md:flex-row w-full md:w-fit items-center gap-2">
        <UButton
          label="Create Pocket"
          icon="i-lucide-plus"
          color="primary"
          class="w-full"
          @click="openCreatePocketModal"
        />
        <UButton
          label="Set Monthly Limit"
          icon="i-lucide-sliders-horizontal"
          color="neutral"
          variant="outline"
          class="w-full text-center items-center"
          @click="openBudgetModal(null, budgetData?.globalBudget?.amount)"
        />
      </div>
    </div>

    <!-- Stats Overview Cards / Skeletons (Bank Jago-style) -->
    <div
      v-if="pending"
      class="w-full"
    >
      <USkeleton class="h-44 rounded-3xl w-full" />
    </div>
    <div
      v-else-if="budgetData"
      class="w-full"
    >
      <MonthlyLimitCard
        :global-budget="budgetData.globalBudget"
        @set-budget="(amt) => openBudgetModal(null, amt)"
      />
    </div>

    <!-- Pockets / Categories Pockets List -->
    <div class="flex flex-col gap-4 mt-2">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xl font-extrabold text-highlighted tracking-tight">
            Your Pockets
          </h3>
          <p class="text-xs text-muted mt-1">
            Each pocket is a category — spending pockets can have a monthly
            limit.
          </p>
        </div>
      </div>

      <!-- Pockets Grid / Skeletons -->
      <div
        v-if="pending"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        <USkeleton
          v-for="i in 6"
          :key="`pocket-skel-${i}`"
          class="h-48 rounded-2xl w-full"
        />
      </div>
      <div
        v-else-if="budgetData && budgetData.pockets.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        <PocketCard
          v-for="pocket in budgetData.pockets"
          :key="pocket.id"
          :pocket="pocket"
          @set-budget="openBudgetModal"
        />
      </div>
      <div
        v-else
        class="p-8 text-center border border-dashed border-muted rounded-2xl text-muted text-sm"
      >
        No categories yet. Create your first pocket to get started.
        <UButton
          label="Create Pocket"
          icon="i-lucide-plus"
          color="primary"
          size="sm"
          class="mt-4"
          block
          @click="openCreatePocketModal"
        />
      </div>
    </div>

    <!-- Budget Configuration Modal -->
    <AppModal
      v-model:open="isModalOpen"
      :title="
        selectedCategoryId === null
          ? 'Configure Overall Budget'
          : 'Configure Pocket Budget'
      "
      submit-label="Save Budget"
      @submit="handleSaveBudget"
    >
      <UFormField label="Budget Limit Amount">
        <CurrencyInput
          v-model="budgetAmount"
          autofocus
        />
      </UFormField>
    </AppModal>

    <!-- Create Pocket Modal -->
    <AppModal
      v-model:open="isCreatePocketModalOpen"
      title="Create New Pocket (Category)"
      submit-label="Create Pocket"
      :disabled="!pocketName.trim()"
      @submit="handleCreatePocket"
    >
      <CategoryFormFields
        v-model:name="pocketName"
        v-model:type="pocketType"
        v-model:color="pocketColor"
        v-model:icon="pocketIcon"
      />

      <UFormField
        v-if="pocketType === 'spending'"
        label="Monthly Budget Limit (Optional)"
      >
        <CurrencyInput v-model="pocketBudgetLimit" />
      </UFormField>
    </AppModal>
  </div>
</template>
