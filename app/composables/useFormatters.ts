import { formatPeriodLabel } from '~~/shared/utils/period'

export function useFormatters() {
  const getLocaleTag = (fallback: 'id-ID' | 'en-US'): 'id-ID' | 'en-US' => {
    try {
      if (typeof useI18n === 'function') {
        const { locale } = useI18n()
        return locale.value === 'en' ? 'en-US' : 'id-ID'
      }
    } catch (error) {
      console.error(error)
    }
    return fallback
  }

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val || 0)
  }

  const formatDate = (dateStr: string | Date): string => {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const localeTag = getLocaleTag('id-ID')
    return d.toLocaleDateString(localeTag, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      // Date-only rows are stored as UTC midnight; render them on the UTC
      // calendar so negative-offset timezones don't shift the day backwards.
      timeZone: d.getTime() % 86_400_000 === 0 ? 'UTC' : undefined
    })
  }

  const toDateInputValue = (dateStr: string | Date | undefined): string => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    if (d.getTime() % 86_400_000 === 0) {
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const formatMonthLabel = (monthStr: string, startDay?: number): string => {
    let effectiveStartDay = startDay
    if (effectiveStartDay === undefined) {
      try {
        if (typeof usePeriod === 'function') {
          effectiveStartDay = usePeriod().periodStartDay.value
        }
      } catch {
        effectiveStartDay = 1
      }
    }
    return formatPeriodLabel(monthStr, effectiveStartDay ?? 1, getLocaleTag('en-US'))
  }

  const getProgressColor = (
    spent: number,
    limit: number
  ):
    | 'error'
    | 'info'
    | 'success'
    | 'primary'
    | 'secondary'
    | 'warning'
    | 'neutral' => {
    if (limit <= 0) return 'neutral'
    const pct = (spent / limit) * 100
    if (pct >= 100) return 'error'
    if (pct >= 80) return 'warning'
    return 'success'
  }

  return {
    formatCurrency,
    formatDate,
    toDateInputValue,
    formatMonthLabel,
    getProgressColor
  }
}
