import { computed } from 'vue'
import type { ChartData, ChartOptions } from 'chart.js'
import {
  getPeriodKeyForDate,
  getPeriodRange,
  shiftPeriodKey
} from '~~/shared/utils/period'

export function useMonthlyTrend() {
  const { transactions } = useFinance()
  const { currentPeriod, periodStartDay } = usePeriod()
  const { t, locale } = useI18n()
  const colorMode = useColorMode()
  const isDark = computed(() => colorMode.value === 'dark')

  const monthlyData = computed(() => {
    const localeTag = locale.value === 'en' ? 'en-US' : 'id-ID'
    const monthSlots: { key: string, label: string }[] = []

    for (let i = -5; i <= 0; i++) {
      const key = shiftPeriodKey(currentPeriod.value, i)
      const { start } = getPeriodRange(key, periodStartDay.value)
      const label = periodStartDay.value === 1
        ? start.toLocaleDateString(localeTag, { month: 'short', timeZone: 'UTC' })
        : start.toLocaleDateString(localeTag, { day: 'numeric', month: 'short', timeZone: 'UTC' })
      monthSlots.push({ key, label })
    }

    const statsMap = new Map<string, { income: number, spending: number }>()
    monthSlots.forEach((slot) => {
      statsMap.set(slot.key, { income: 0, spending: 0 })
    })

    transactions.value.forEach((t) => {
      if (t.transferWalletId) return
      const d = new Date(t.transactionDate || new Date())
      if (!isNaN(d.getTime())) {
        const key = getPeriodKeyForDate(d, periodStartDay.value)
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
        label: t('transactions.income'),
        data: monthlyData.value.incomeValues,
        backgroundColor: 'rgba(16, 185, 129, 0.8)', // Emerald-500
        borderRadius: 6,
        borderWidth: 0,
        maxBarThickness: 16
      },
      {
        label: t('transactions.spending'),
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
        beginAtZero: true,
        grid: {
          color: isDark.value
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(156, 163, 175, 0.1)'
        },
        ticks: {
          precision: 0,
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
