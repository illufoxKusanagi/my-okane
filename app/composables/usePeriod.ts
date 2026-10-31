import { computed, watch } from 'vue'
import {
  clampPeriodStartDay,
  formatPeriodLabel,
  getPeriodKeyForDate,
  getPeriodRange,
  isDateInPeriod,
  shiftPeriodKey
} from '~~/shared/utils/period'

export function usePeriod() {
  const { user, fetch: fetchSession } = useUserSession()
  const { t, locale } = useI18n()
  const toast = useToast()

  const periodStartDay = computed(() => clampPeriodStartDay(user.value?.periodStartDay))
  const currentPeriod = useState<string>('finance:currentPeriod', () =>
    getPeriodKeyForDate(new Date(), periodStartDay.value)
  )

  watch(periodStartDay, (newStartDay) => {
    currentPeriod.value = getPeriodKeyForDate(new Date(), newStartDay)
  })

  const prevPeriod = () => {
    currentPeriod.value = shiftPeriodKey(currentPeriod.value, -1)
  }

  const nextPeriod = () => {
    currentPeriod.value = shiftPeriodKey(currentPeriod.value, 1)
  }

  const periodRange = computed(() => getPeriodRange(currentPeriod.value, periodStartDay.value))

  const periodLabel = computed(() => {
    const localeTag = locale.value === 'en' ? 'en-US' : 'id-ID'
    return formatPeriodLabel(currentPeriod.value, periodStartDay.value, localeTag)
  })

  const updatePeriodStartDay = async (day: number) => {
    const clamped = clampPeriodStartDay(day)
    await $fetch('/api/auth/profile', {
      method: 'PUT',
      body: { periodStartDay: clamped }
    })
    await fetchSession()
    currentPeriod.value = getPeriodKeyForDate(new Date(), clamped)
    toast.add({
      title: t('account.periodUpdatedTitle'),
      description: t('account.periodUpdatedDesc', { day: clamped }),
      color: 'success'
    })
  }

  const isDateInCurrentPeriod = (d: Date | string | number) =>
    isDateInPeriod(d, currentPeriod.value, periodStartDay.value)

  return {
    periodStartDay,
    currentPeriod,
    periodRange,
    periodLabel,
    prevPeriod,
    nextPeriod,
    updatePeriodStartDay,
    isDateInCurrentPeriod
  }
}
