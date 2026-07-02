<script setup lang="ts">
import { computed } from "vue";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  type ChartData,
  type ChartOptions
} from "chart.js";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const { transactions } = useFinance();

const monthlyData = computed(() => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  
  // Initialize map for 12 months
  const statsMap = new Map<string, { income: number; spending: number }>();
  months.forEach((m) => {
    statsMap.set(m, { income: 0, spending: 0 });
  });

  // Aggregate transactions
  transactions.value.forEach((t) => {
    const d = new Date(t.transactionDate || new Date());
    if (d.getFullYear() === currentYear) {
      const monthName = months[d.getMonth()] || "Jan";
      const stats = statsMap.get(monthName) || { income: 0, spending: 0 };
      if (t.type === "income") {
        stats.income += t.amount;
      } else {
        stats.spending += t.amount;
      }
      statsMap.set(monthName, stats);
    }
  });

  // Convert map to arrays
  const labels: string[] = [];
  const incomeValues: number[] = [];
  const spendingValues: number[] = [];

  // Let's only display months that have data, or the last 6 months
  const currentMonthIdx = new Date().getMonth();
  // Show last 6 months (including current month)
  for (let i = 5; i >= 0; i--) {
    const idx = (currentMonthIdx - i + 12) % 12;
    const mName = months[idx] || "Jan";
    const data = statsMap.get(mName) || { income: 0, spending: 0 };
    labels.push(mName);
    incomeValues.push(data.income);
    spendingValues.push(data.spending);
  }

  return { labels, incomeValues, spendingValues };
});

const chartData = computed<ChartData<"bar">>(() => ({
  labels: monthlyData.value.labels,
  datasets: [
    {
      label: "Income",
      data: monthlyData.value.incomeValues,
      backgroundColor: "rgba(16, 185, 129, 0.8)", // Emerald-500
      borderRadius: 6,
      borderWidth: 0,
      maxBarThickness: 16
    },
    {
      label: "Spending",
      data: monthlyData.value.spendingValues,
      backgroundColor: "rgba(244, 63, 94, 0.8)", // Rose-500
      borderRadius: 6,
      borderWidth: 0,
      maxBarThickness: 16
    }
  ]
}));

const chartOptions = computed<ChartOptions<"bar">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      align: "end",
      labels: {
        usePointStyle: true,
        pointStyle: "circle",
        padding: 20,
        color: "hsl(var(--ui-text-muted, 0 0% 50%))",
        font: {
          family: "system-ui, sans-serif",
          size: 11
        }
      }
    },
    tooltip: {
      backgroundColor: "hsl(var(--ui-bg-elevated, 0 0% 95%))",
      titleColor: "hsl(var(--ui-text, 0 0% 10%))",
      bodyColor: "hsl(var(--ui-text-muted, 0 0% 40%))",
      borderColor: "hsl(var(--ui-border, 0 0% 90%))",
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (ctx) => {
          return ` ${ctx.dataset.label}: Rp. ${(ctx.parsed.y ?? 0).toLocaleString()}`;
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: "hsl(var(--ui-text-muted, 0 0% 50%))",
        font: {
          size: 11
        }
      }
    },
    y: {
      grid: {
        color: "rgba(156, 163, 175, 0.1)"
      },
      ticks: {
        color: "hsl(var(--ui-text-muted, 0 0% 50%))",
        font: {
          size: 11
        },
        callback: (value) => {
          if (Number(value) >= 1000000) {
            return `${(Number(value) / 1000000).toFixed(1)}M`;
          }
          if (Number(value) >= 1000) {
            return `${(Number(value) / 1000).toFixed(0)}k`;
          }
          return value;
        }
      }
    }
  }
}));
</script>

<template>
  <UCard class="w-full" :ui="{ body: 'h-80' }">
    <template #header>
      <div class="flex flex-col gap-1">
        <p class="font-semibold text-base text-highlighted">Cash Flow Trend</p>
        <p class="text-sm text-muted">Comparison of income vs spending for the last 6 months</p>
      </div>
    </template>

    <div class="w-full h-full relative">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </UCard>
</template>
