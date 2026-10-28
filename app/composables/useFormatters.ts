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

  const formatMonthLabel = (monthStr: string): string => {
    const parts = monthStr.split('-').map(Number)
    const year = parts[0] ?? new Date().getFullYear()
    const month = parts[1] ?? new Date().getMonth() + 1
    const date = new Date(Date.UTC(year, month - 1, 1))
    const localeTag = getLocaleTag('en-US')
    return date.toLocaleDateString(localeTag, {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    })
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
