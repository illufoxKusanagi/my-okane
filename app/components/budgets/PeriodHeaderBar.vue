<script setup lang="ts">
import { ref } from 'vue'

const {
  periodStartDay,
  periodLabel,
  prevPeriod,
  nextPeriod,
  updatePeriodStartDay
} = usePeriod()

const isPopoverOpen = ref(false)
const isUpdating = ref(false)

const handleSelectDay = async (day: number) => {
  if (isUpdating.value) return
  isUpdating.value = true
  try {
    await updatePeriodStartDay(day)
    isPopoverOpen.value = false
  } finally {
    isUpdating.value = false
  }
}
</script>

<template>
  <div
    class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-elevated/70 border border-muted/50 p-5 rounded-2xl shadow-sm backdrop-blur-md"
  >
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-1 sm:gap-2">
        <UButton
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="ghost"
          :aria-label="$t('common.back')"
          @click="prevPeriod"
        />
        <span class="text-base sm:text-lg font-bold text-highlighted min-w-40 text-center select-none">
          {{ periodLabel }}
        </span>
        <UButton
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="ghost"
          :aria-label="$t('common.submit')"
          @click="nextPeriod"
        />
      </div>

      <UPopover v-model:open="isPopoverOpen">
        <UButton
          icon="i-lucide-calendar-cog"
          color="neutral"
          variant="subtle"
          size="sm"
          :label="$t('dashboard.cutoffDayBadge', { day: periodStartDay })"
          :loading="isUpdating"
        />
        <template #content>
          <div class="p-4 w-72 flex flex-col gap-3">
            <div>
              <p class="text-sm font-semibold text-highlighted">
                {{ $t('account.periodStartDay') }}
              </p>
              <p class="text-xs text-muted mt-0.5 leading-relaxed">
                {{ $t('account.periodStartDayDesc') }}
              </p>
            </div>
            <div class="grid grid-cols-7 gap-1.5">
              <UButton
                v-for="d in 28"
                :key="d"
                size="xs"
                :color="periodStartDay === d ? 'primary' : 'neutral'"
                :variant="periodStartDay === d ? 'solid' : 'ghost'"
                class="justify-center font-mono text-xs"
                :disabled="isUpdating"
                @click="handleSelectDay(d)"
              >
                {{ d }}
              </UButton>
            </div>
          </div>
        </template>
      </UPopover>
    </div>

    <div
      v-if="$slots.actions"
      class="flex flex-col md:flex-row w-full md:w-fit items-center gap-2"
    >
      <slot name="actions" />
    </div>
  </div>
</template>
