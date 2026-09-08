<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { usePieChart } from './usePieChart'

ChartJS.register(ArcElement, Tooltip, Legend)

interface DataItem {
  label: string
  value: number
  color: string
}

const props = withDefaults(
  defineProps<{
    data?: DataItem[]
    title?: string
    description?: string
    centerLabel?: string
    centerSubLabel?: string
    trend?: string
    trendNote?: string
  }>(),
  {
    title: 'Spending Breakdown',
    description: 'January - June 2024',
    centerSubLabel: 'Total',
    trend: '+5.2% this month',
    trendNote: 'Showing total spending for the last 6 months',
    data: () => [
      { label: 'Food', value: 275, color: 'hsl(220 70% 50%)' },
      { label: 'Transport', value: 200, color: 'hsl(160 60% 45%)' },
      { label: 'Entertainment', value: 187, color: 'hsl(30 80% 55%)' },
      { label: 'Utilities', value: 173, color: 'hsl(280 65% 55%)' },
      { label: 'Others', value: 190, color: 'hsl(0 65% 55%)' }
    ]
  }
)

const { colorMode, chartData, chartOptions, centerTextPlugin } = usePieChart(props)
</script>

<template>
  <UCard
    class="flex flex-col"
    :ui="{ body: 'flex-1 flex flex-col gap-4' }"
  >
    <!-- Header -->
    <template #header>
      <div class="flex flex-col gap-1">
        <p class="font-semibold text-base text-highlighted">
          {{ title }}
        </p>
        <p class="text-sm text-muted">
          {{ description }}
        </p>
      </div>
    </template>

    <!-- Chart -->
    <div class="relative mx-auto w-full max-w-[240px] aspect-square">
      <Doughnut
        :key="colorMode.value"
        :data="chartData"
        :options="chartOptions"
        :plugins="[centerTextPlugin]"
      />
    </div>

    <!-- Legend -->
    <ul class="flex flex-col gap-2">
      <li
        v-for="item in data"
        :key="item.label"
        class="flex items-center justify-between text-sm"
      >
        <div class="flex items-center gap-2">
          <span
            class="size-2.5 rounded-full shrink-0"
            :style="{ backgroundColor: item.color }"
          />
          <span class="text-muted">{{ item.label }}</span>
        </div>
        <span class="font-medium tabular-nums">Rp. {{ item.value.toLocaleString() }}</span>
      </li>
    </ul>

    <!-- Footer -->
    <template #footer>
      <div class="flex flex-col gap-1 text-sm">
        <div class="flex items-center gap-1.5 font-medium text-highlighted">
          <UIcon
            name="i-lucide-trending-up"
            class="size-4 text-success"
          />
          {{ trend }}
        </div>
        <p class="text-muted">
          {{ trendNote }}
        </p>
      </div>
    </template>
  </UCard>
</template>
