<script setup lang="ts">
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { useMonthlyTrend } from "./useMonthlyTrend";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
);

const { colorMode, chartData, chartOptions } = useMonthlyTrend();
</script>

<template>
  <UCard class="w-full" :ui="{ body: 'h-80' }">
    <template #header>
      <div class="flex flex-col gap-1">
        <p class="font-semibold text-base text-highlighted">Cash Flow Trend</p>
        <p class="text-sm text-muted">
          Comparison of income vs spending for the last 6 months
        </p>
      </div>
    </template>

    <div class="w-full h-full relative">
      <Bar :key="colorMode.value" :data="chartData" :options="chartOptions" />
    </div>
  </UCard>
</template>
