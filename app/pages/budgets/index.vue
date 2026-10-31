<script setup lang="ts">
import AppModal from '~/components/ui/AppModal.vue'
import CategoryFormFields from '~/components/categories/CategoryFormFields.vue'
import MonthlyLimitCard from '~/components/budgets/MonthlyLimitCard.vue'
import PocketCard from '~/components/budgets/PocketCard.vue'
import PeriodHeaderBar from '~/components/budgets/PeriodHeaderBar.vue'
import CurrencyInput from '~/components/ui/CurrencyInput.vue'
import { useBudgetsController } from './useBudgetsController'

const { t } = useI18n()

useSeoMeta({
  title: () => t('budgets.title')
})

const {
  budgetData,
  pending,
  isSaving,
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
  openBudgetModal,
  handleSaveBudget
} = useBudgetsController()
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 sm:p-6 lg:p-8 pb-12 sm:pb-8"
  >
    <!-- Period Navigation Header -->
    <PeriodHeaderBar>
      <template #actions>
        <UButton
          :label="$t('budgets.createPocket')"
          icon="i-lucide-plus"
          color="primary"
          class="w-full"
          @click="openCreatePocketModal"
        />
        <UButton
          :label="$t('budgets.monthlyLimit')"
          icon="i-lucide-sliders-horizontal"
          color="neutral"
          variant="outline"
          class="w-full text-center items-center"
          @click="openBudgetModal(null, budgetData?.globalBudget?.amount)"
        />
      </template>
    </PeriodHeaderBar>

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
            {{ $t('budgets.pockets') }}
          </h3>
          <p class="text-xs text-muted mt-1">
            {{ $t('budgets.subtitle') }}
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
        {{ $t('budgets.noPocketsFound') }}
        <UButton
          :label="$t('budgets.createPocket')"
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
          ? $t('budgets.configureOverallBudget')
          : $t('budgets.configurePocketLimit')
      "
      :submit-label="$t('budgets.saveBudget')"
      :loading="isSaving"
      @submit="handleSaveBudget"
    >
      <UFormField :label="$t('budgets.limitAmount')">
        <CurrencyInput
          v-model="budgetAmount"
          autofocus
        />
      </UFormField>
    </AppModal>

    <!-- Create Pocket Modal -->
    <AppModal
      v-model:open="isCreatePocketModalOpen"
      :title="$t('budgets.createPocketTitle')"
      :submit-label="$t('budgets.createPocket')"
      :loading="isSaving"
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
        :label="$t('budgets.monthlyBudgetLimitOptional')"
      >
        <CurrencyInput v-model="pocketBudgetLimit" />
      </UFormField>
    </AppModal>
  </div>
</template>
