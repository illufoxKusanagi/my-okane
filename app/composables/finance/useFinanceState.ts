import { watch, computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import * as Sentry from '@sentry/nuxt'
import type { Transaction, Category } from './types'

export interface FinanceState {
  transactions: Ref<Transaction[]>
  categories: Ref<Category[]>
  isInitialized: Ref<boolean>
  isLoading: ComputedRef<boolean>
  fetchAll: () => Promise<void>
  reset: () => void
}

let inFlightFetch: Promise<void> | null = null
let isSessionWatcherActive = false

export function useFinanceState(): FinanceState {
  const transactions = useState<Transaction[]>('finance:transactions', () => [])
  const categories = useState<Category[]>('finance:categories', () => [])
  const isInitialized = useState<boolean>('finance:isInitialized', () => false)

  const fetchAll = async () => {
    if (inFlightFetch) return inFlightFetch
    if (isInitialized.value) return

    inFlightFetch = (async () => {
      try {
        const [txData, catData] = await Promise.all([
          $fetch<Transaction[]>('/api/transactions'),
          $fetch<Category[]>('/api/categories')
        ])
        transactions.value = txData
        categories.value = catData
        isInitialized.value = true
      } catch (error) {
        console.error('Failed to fetch finance data:', error)
        Sentry.captureException(error)
      } finally {
        inFlightFetch = null
      }
    })()

    return inFlightFetch
  }

  const reset = () => {
    transactions.value = []
    categories.value = []
    isInitialized.value = false
    inFlightFetch = null
  }

  const isLoading = computed(() => !isInitialized.value)

  return { transactions, categories, isInitialized, isLoading, fetchAll, reset }
}

/**
 * Session lifecycle bootstrap: fetches on mount when a session exists and
 * re-syncs/resets whenever the user session changes. Guarded by isSessionWatcherActive
 * so it registers exactly once globally across all consumer components.
 */
export function watchFinanceSession(state: FinanceState): void {
  if (isSessionWatcherActive || !import.meta.client) return
  isSessionWatcherActive = true

  const { user } = useUserSession()

  watch(
    user,
    (newUser) => {
      if (newUser) {
        state.fetchAll()
      } else {
        state.reset()
      }
    },
    { immediate: true }
  )
}
