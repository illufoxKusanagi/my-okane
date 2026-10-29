import { ref, computed } from 'vue'
import type {
  WalletWithBalance,
  CreateWalletPayload,
  UpdateWalletPayload,
  TransferFundsPayload
} from './types'

let isWalletSessionWatcherActive = false

export function useWallets() {
  const wallets = useState<WalletWithBalance[]>('user_wallets', () => [])
  const selectedWalletId = useState<string | 'all'>(
    'selected_wallet_id',
    () => 'all'
  )
  const isLoading = ref(false)
  const isInitialized = useState<boolean>('wallets:isInitialized', () => false)

  const toast = useToast()
  const { formatCurrency } = useFormatters()

  let t = (key: string, values?: Record<string, unknown>) => {
    const fallbackMap: Record<string, string> = {
      'toasts.walletCreated': 'Account Created',
      'toasts.walletCreatedDesc': `Successfully created "${values?.name}".`,
      'toasts.walletCreateFailed': 'Failed to Create Account',
      'toasts.walletUpdated': 'Account Updated',
      'toasts.walletUpdatedDesc': `Successfully updated "${values?.name}".`,
      'toasts.walletUpdateFailed': 'Failed to Update Account',
      'toasts.walletDeleted': 'Account Deleted',
      'toasts.walletDeletedDesc': 'Account has been deleted successfully.',
      'toasts.walletDeleteFailed': 'Failed to Delete Account',
      'toasts.transferCompleted': 'Transfer Completed',
      'toasts.transferCompletedDesc': `Successfully transferred ${values?.amount}.`,
      'toasts.transferFailed': 'Transfer Failed'
    }
    return fallbackMap[key] ?? key
  }
  try {
    if (typeof useI18n === 'function') t = useI18n().t
  } catch {
    // Non-Nuxt / test fallback
  }

  const fetchWallets = async (force = false) => {
    if (isInitialized.value && !force) return
    isLoading.value = true
    try {
      const res = await $fetch<{ success: boolean, data: WalletWithBalance[] }>(
        '/api/wallets'
      )
      if (res.success && res.data) {
        wallets.value = res.data
        isInitialized.value = true
      }
    } catch (error) {
      console.error('Failed to fetch wallets:', error)
    } finally {
      isLoading.value = false
    }
  }

  const createWallet = async (payload: CreateWalletPayload) => {
    isLoading.value = true
    try {
      const res = await $fetch<{ success: boolean, data: WalletWithBalance }>(
        '/api/wallets',
        {
          method: 'POST',
          body: payload
        }
      )
      if (res.success && res.data) {
        if (res.data.isDefault) {
          wallets.value = wallets.value.map(w => ({
            ...w,
            isDefault: false
          }))
        }
        wallets.value = [res.data, ...wallets.value]
        toast.add({
          title: t('toasts.walletCreated'),
          description: t('toasts.walletCreatedDesc', { name: res.data.name }),
          color: 'success'
        })
        return res.data
      }
    } catch (error) {
      console.error('Failed to create wallet:', error)
      toast.add({
        title: t('toasts.walletCreateFailed'),
        description: describeApiError(error),
        color: 'error'
      })
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const updateWallet = async (id: string, payload: UpdateWalletPayload) => {
    isLoading.value = true
    try {
      const res = await $fetch<{ success: boolean, data: WalletWithBalance }>(
        `/api/wallets/${id}`,
        {
          method: 'PUT',
          body: payload
        }
      )
      if (res.success && res.data) {
        if (res.data.isDefault) {
          wallets.value = wallets.value.map(w =>
            w.id === id ? res.data : { ...w, isDefault: false }
          )
        } else {
          wallets.value = wallets.value.map(w =>
            w.id === id ? res.data : w
          )
        }
        await fetchWallets(true)
        toast.add({
          title: t('toasts.walletUpdated'),
          description: t('toasts.walletUpdatedDesc', { name: res.data.name }),
          color: 'success'
        })
        return res.data
      }
    } catch (error) {
      console.error('Failed to update wallet:', error)
      toast.add({
        title: t('toasts.walletUpdateFailed'),
        description: describeApiError(error),
        color: 'error'
      })
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const deleteWallet = async (id: string) => {
    isLoading.value = true
    try {
      const res = await $fetch<{ success: boolean }>(`/api/wallets/${id}`, {
        method: 'DELETE'
      })
      if (res.success) {
        wallets.value = wallets.value.filter(w => w.id !== id)
        if (selectedWalletId.value === id) selectedWalletId.value = 'all'
        await fetchWallets(true)
        toast.add({
          title: t('toasts.walletDeleted'),
          description: t('toasts.walletDeletedDesc'),
          color: 'success'
        })
      }
    } catch (error) {
      console.error('Failed to delete wallet:', error)
      toast.add({
        title: t('toasts.walletDeleteFailed'),
        description: describeApiError(error),
        color: 'error'
      })
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const transferFunds = async (payload: TransferFundsPayload) => {
    isLoading.value = true
    const source = wallets.value.find(w => w.id === payload.sourceWalletId)
    const target = wallets.value.find(w => w.id === payload.targetWalletId)
    if (source && target) {
      source.balance -= payload.amount
      target.balance += payload.amount
    }
    try {
      const res = await $fetch<{ success: boolean }>('/api/wallets/transfer', {
        method: 'POST',
        body: payload
      })
      if (res.success) {
        await fetchWallets(true)
        try {
          await useFinance().fetchAll()
        } catch {
          // outside vue injection context
        }
        toast.add({
          title: t('toasts.transferCompleted'),
          description: t('toasts.transferCompletedDesc', {
            amount: formatCurrency(payload.amount)
          }),
          color: 'success'
        })
        return res
      }
    } catch (error) {
      if (source && target) {
        source.balance += payload.amount
        target.balance -= payload.amount
      }
      console.error('Failed to transfer funds:', error)
      toast.add({
        title: t('toasts.transferFailed'),
        description: describeApiError(error),
        color: 'error'
      })
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const totalNetWorth = computed(() =>
    wallets.value.reduce((sum, w) => sum + (w.balance || 0), 0)
  )

  const defaultWallet = computed(
    () => wallets.value.find(w => w.isDefault) || wallets.value[0] || null
  )

  const selectedWallet = computed(() =>
    selectedWalletId.value === 'all'
      ? null
      : wallets.value.find(w => w.id === selectedWalletId.value) || null
  )

  if (!isWalletSessionWatcherActive && import.meta.client) {
    isWalletSessionWatcherActive = true
    const { user } = useUserSession()
    watch(
      user,
      (newUser) => {
        if (newUser) {
          fetchWallets(true)
        } else {
          wallets.value = []
          isInitialized.value = false
          selectedWalletId.value = 'all'
        }
      },
      { immediate: true }
    )
  }

  return {
    wallets,
    selectedWalletId,
    selectedWallet,
    defaultWallet,
    totalNetWorth,
    isLoading,
    isInitialized,
    fetchWallets,
    createWallet,
    updateWallet,
    deleteWallet,
    transferFunds
  }
}
