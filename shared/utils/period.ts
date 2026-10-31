export function clampPeriodStartDay(day?: number | null): number {
  if (typeof day !== 'number' || !Number.isFinite(day)) {
    return 1
  }
  return Math.min(28, Math.max(1, Math.trunc(day)))
}

function parsePeriodParts(key: string): { year: number, month: number } {
  const parts = key.split('-')
  const y = Number(parts[0])
  const m = Number(parts[1])
  return {
    year: Number.isFinite(y) ? y : new Date().getUTCFullYear(),
    month: Number.isFinite(m) ? m : new Date().getUTCMonth() + 1
  }
}

export function getPeriodKeyForDate(dateInput: Date | string | number, startDayInput = 1): string {
  const parsed = new Date(dateInput)
  const d = Number.isNaN(parsed.getTime()) ? new Date() : parsed
  const startDay = clampPeriodStartDay(startDayInput)
  const isUtc = d.getTime() % 86_400_000 === 0
  const year = isUtc ? d.getUTCFullYear() : d.getFullYear()
  const month = isUtc ? d.getUTCMonth() : d.getMonth()
  const day = isUtc ? d.getUTCDate() : d.getDate()

  if (day < startDay) {
    const prev = new Date(Date.UTC(year, month - 1, 1))
    return `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

export function getPeriodRange(periodKey: string, startDayInput = 1): { start: Date, end: Date } {
  const startDay = clampPeriodStartDay(startDayInput)
  const safeKey = /^\d{4}-\d{2}$/.test(periodKey) ? periodKey : getPeriodKeyForDate(new Date(), startDay)
  const { year, month } = parsePeriodParts(safeKey)

  if (startDay === 1) {
    return {
      start: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
      end: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
    }
  }
  return {
    start: new Date(Date.UTC(year, month - 1, startDay, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, month, startDay - 1, 23, 59, 59, 999))
  }
}

export function isDateInPeriod(dateInput: Date | string | number, periodKey: string, startDayInput = 1): boolean {
  const d = new Date(dateInput)
  if (Number.isNaN(d.getTime())) {
    return false
  }
  const { start, end } = getPeriodRange(periodKey, startDayInput)
  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime()
}

export function shiftPeriodKey(periodKey: string, deltaMonths: number): string {
  const safeKey = /^\d{4}-\d{2}$/.test(periodKey) ? periodKey : getPeriodKeyForDate(new Date(), 1)
  const { year, month } = parsePeriodParts(safeKey)
  const d = new Date(Date.UTC(year, month - 1 + deltaMonths, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function formatPeriodLabel(
  periodKey: string,
  startDayInput = 1,
  localeTag: 'id-ID' | 'en-US' = 'id-ID'
): string {
  const startDay = clampPeriodStartDay(startDayInput)
  const { start, end } = getPeriodRange(periodKey, startDay)

  if (startDay === 1) {
    return start.toLocaleDateString(localeTag, { month: 'long', year: 'numeric', timeZone: 'UTC' })
  }

  const sameYear = start.getUTCFullYear() === end.getUTCFullYear()
  const startStr = start.toLocaleDateString(localeTag, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
    timeZone: 'UTC'
  })
  const endStr = end.toLocaleDateString(localeTag, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  })
  return `${startStr} – ${endStr}`
}
