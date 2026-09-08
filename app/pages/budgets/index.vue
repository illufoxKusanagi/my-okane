<script setup lang="ts">
import AppModal from '~/components/ui/AppModal.vue'
import ColorIconPicker from '~/components/ui/ColorIconPicker.vue'
import BalanceCard from '~/components/budgets/BalanceCard.vue'
import MonthlyLimitCard from '~/components/budgets/MonthlyLimitCard.vue'
import PocketCard from '~/components/budgets/PocketCard.vue'
import { useBudgetsController } from './useBudgetsController'

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
  <UDashboardPanel>
    <UDashboardNavbar title="Budgets & Pockets">
      <template #left>
        <UDashboardSidebarToggle />
      </template>
      <template #right>
        <ColorModeButton />
      </template>
    </UDashboardNavbar>

    <div class="h-full overflow-auto p-4 md:p-6">
      <UContainer class="flex flex-col gap-6 max-w-6xl">
        <!-- Month Selection Header -->
        <div
          class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 p-5 rounded-2xl shadow-sm backdrop-blur-md"
        >
          <div class="flex items-center gap-3">
            <UButton
              icon="i-lucide-chevron-left"
              color="neutral"
              variant="ghost"
              @click="prevMonth"
            />
            <span
              class="text-lg font-bold text-neutral-850 dark:text-neutral-100 min-w-44 text-center"
            >
              {{ formatMonthLabel(currentMonth) }}
            </span>
            <UButton
              icon="i-lucide-chevron-right"
              color="neutral"
              variant="ghost"
              @click="nextMonth"
            />
          </div>

          <div class="flex items-center gap-2">
            <UButton
              label="Create Pocket"
              icon="i-lucide-plus"
              color="primary"
              @click="openCreatePocketModal"
            />
            <UButton
              label="Set Monthly Limit"
              icon="i-lucide-sliders-horizontal"
              color="neutral"
              variant="outline"
              @click="
                openBudgetModal(null, budgetData?.globalBudget?.amount)
              "
            />
          </div>
        </div>

        <!-- Stats Overview Cards / Skeletons (Bank Jago-style) -->
        <div
          v-if="pending"
          class="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <USkeleton class="h-44 rounded-3xl w-full" />
          <USkeleton class="h-44 rounded-3xl w-full" />
        </div>
        <div
          v-else-if="budgetData"
          class="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <BalanceCard
            :balance="budgetData.balance"
            :total-income="budgetData.totalIncome"
            :total-spending="budgetData.totalSpending"
          />

          <MonthlyLimitCard
            :global-budget="budgetData.globalBudget"
            @set-budget="(amt) => openBudgetModal(null, amt)"
          />
        </div>

        <!-- Pockets / Categories Pockets List -->
        <div class="flex flex-col gap-4 mt-2">
          <div class="flex items-center justify-between">
            <h3
              class="text-xl font-extrabold text-neutral-800 dark:text-neutral-100 tracking-tight"
            >
              Your Pockets (Kantong)
            </h3>
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
            class="p-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-500 text-sm"
          >
            No pockets found for this month.
          </div>
        </div>
      </UContainer>
    </div>

    <!-- Budget Configuration Modal -->
    <AppModal
      v-model:open="isModalOpen"
      :title="selectedCategoryId === null ? 'Configure Overall Budget' : 'Configure Pocket Budget'"
      submit-label="Save Budget"
      @submit="handleSaveBudget"
    >
      <div>
        <p class="text-sm font-semibold mb-2">
          Budget Limit Amount
        </p>
        <UInput
          v-model="budgetAmount"
          type="number"
          placeholder="e.g. 500000"
          class="w-full"
          autofocus
        />
      </div>
    </AppModal>

    <!-- Create Pocket Modal -->
    <AppModal
      v-model:open="isCreatePocketModalOpen"
      title="Create New Pocket (Category)"
      submit-label="Create Pocket"
      @submit="handleCreatePocket"
    >
      <div>
        <p class="text-sm font-semibold mb-2">
          Pocket Name
        </p>
        <UInput
          v-model="pocketName"
          placeholder="e.g. Emergency Fund, Vacation, Coffee"
          class="w-full"
          autofocus
        />
      </div>

      <div>
        <p class="text-sm font-semibold mb-2">
          Pocket Type
        </p>
        <USelect
          v-model="pocketType"
          :items="[
            { label: 'Spending Pocket', value: 'spending' },
            { label: 'Income Pocket', value: 'income' }
          ]"
          class="w-full"
        />
      </div>

      <div v-if="pocketType === 'spending'">
        <p class="text-sm font-semibold mb-2">
          Monthly Budget Limit (Optional)
        </p>
        <UInput
          v-model="pocketBudgetLimit"
          type="number"
          placeholder="e.g. 500000"
          class="w-full"
        />
      </div>

      <ColorIconPicker
        v-model:color="pocketColor"
        v-model:icon="pocketIcon"
      />
    </AppModal>
  </UDashboardPanel>
</template>
