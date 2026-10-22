export function useFormatters() {
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
    return d.toLocaleDateString('id-ID', {
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
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    })
  }

  const getProgressColor = (
    spent: number,
    limit: number
  ): 'error' | 'info' | 'success' | 'primary' | 'secondary' | 'warning' | 'neutral' => {
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
