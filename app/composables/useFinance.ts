import { useFinanceState, watchFinanceSession } from './finance/useFinanceState'
import { useTransactionActions } from './finance/useTransactionActions'
import { useCategoryActions } from './finance/useCategoryActions'
import { useFinanceSelectors } from './finance/useFinanceSelectors'

export type {
  Transaction,
  Category,
  CategoryData,
  Wallet,
  WalletType,
  WalletWithBalance
} from './finance/types'

export function useFinance() {
  const state = useFinanceState()

  // One session watcher per useFinance() call, matching historical semantics
  // (each consumer component re-syncs on session change).
  watchFinanceSession(state)

  const transactionActions = useTransactionActions()
  const categoryActions = useCategoryActions()
  const selectors = useFinanceSelectors()

  return {
    ...state,
    ...transactionActions,
    ...categoryActions,
    ...selectors
  }
}
