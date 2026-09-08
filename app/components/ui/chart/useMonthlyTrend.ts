import { computed } from 'vue'
import type { ChartData, ChartOptions } from 'chart.js'

export function useMonthlyTrend() {
  const { transactions } = useFinance()
  const colorMode = useColorMode()
  const isDark = computed(() => colorMode.value === 'dark')

  const monthlyData = computed(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    const now = new Date()

    const monthSlots: { key: string, label: string }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = months[d.getMonth()] || 'Jan'
      monthSlots.push({ key, label })
    }

    const statsMap = new Map<string, { income: number, spending: number }>()
    monthSlots.forEach((slot) => {
      statsMap.set(slot.key, { income: 0, spending: 0 })
    })

    transactions.value.forEach((t) => {
      const d = new Date(t.transactionDate || new Date())
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (statsMap.has(key)) {
          const stats = statsMap.get(key)!
          if (t.type === 'income') {
            stats.income += t.amount
          } else {
            stats.spending += t.amount
          }
        }
      }
    })

    const labels: string[] = []
    const incomeValues: number[] = []
    const spendingValues: number[] = []

    monthSlots.forEach((slot) => {
      const data = statsMap.get(slot.key) || { income: 0, spending: 0 }
      labels.push(slot.label)
      incomeValues.push(data.income)
      spendingValues.push(data.spending)
    })

    return { labels, incomeValues, spendingValues }
  })

  const chartData = computed<ChartData<'bar'>>(() => ({
    labels: monthlyData.value.labels,
    datasets: [
      {
        label: 'Income',
        data: monthlyData.value.incomeValues,
        backgroundColor: 'rgba(16, 185, 129, 0.8)', // Emerald-500
        borderRadius: 6,
        borderWidth: 0,
        maxBarThickness: 16
      },
      {
        label: 'Spending',
        data: monthlyData.value.spendingValues,
        backgroundColor: 'rgba(244, 63, 94, 0.8)', // Rose-500
        borderRadius: 6,
        borderWidth: 0,
        maxBarThickness: 16
      }
    ]
  }))

  const chartOptions = computed<ChartOptions<'bar'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          color: isDark.value ? '#9ca3af' : '#4b5563',
          font: {
            family: 'system-ui, sans-serif',
            size: 11
          }
        }
      },
      tooltip: {
        backgroundColor: isDark.value ? '#1f2937' : '#ffffff',
        titleColor: isDark.value ? '#f3f4f6' : '#111827',
        bodyColor: isDark.value ? '#9ca3af' : '#4b5563',
        borderColor: isDark.value ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            return ` ${ctx.dataset.label}: Rp. ${(ctx.parsed.y ?? 0).toLocaleString()}`
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
          color: isDark.value ? '#9ca3af' : '#4b5563',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: isDark.value
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(156, 163, 175, 0.1)'
        },
        ticks: {
          color: isDark.value ? '#9ca3af' : '#4b5563',
          font: {
            size: 11
          },
          callback: (value) => {
            if (Number(value) >= 1000000) {
              return `${(Number(value) / 1000000).toFixed(1)}M`
            }
            if (Number(value) >= 1000) {
              return `${(Number(value) / 1000).toFixed(0)}k`
            }
            return value
          }
        }
      }
    }
  }))

  return {
    colorMode,
    chartData,
    chartOptions
  }
}
