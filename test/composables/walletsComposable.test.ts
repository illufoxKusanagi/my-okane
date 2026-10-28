import { describe, it, expect } from 'vitest'
import type { WalletWithBalance, WalletType } from '~/composables/finance/types'

describe('Wallets Types & Computed Logic', () => {
  const mockWallets: WalletWithBalance[] = [
    {
      id: 'w-1',
      name: 'BCA Main',
      type: 'bank' as WalletType,
      color: 'emerald',
      icon: 'i-lucide-building-2',
      accountNumber: '4829',
      initialBalance: 1000000,
      balance: 2500000,
      isDefault: true,
      createdAt: new Date()
    },
    {
      id: 'w-2',
      name: 'GoPay',
      type: 'ewallet' as WalletType,
      color: 'blue',
      icon: 'i-lucide-smartphone',
      accountNumber: '0812',
      initialBalance: 50000,
      balance: 350000,
      isDefault: false,
      createdAt: new Date()
    },
    {
      id: 'w-3',
      name: 'Emergency Savings',
      type: 'savings' as WalletType,
      color: 'indigo',
      icon: 'i-lucide-piggy-bank',
      accountNumber: null,
      initialBalance: 5000000,
      balance: 10000000,
      isDefault: false,
      createdAt: new Date()
    }
  ]

  it('calculates total net worth correctly across all wallets', () => {
    const totalNetWorth = mockWallets.reduce((sum, w) => sum + (w.balance || 0), 0)
    expect(totalNetWorth).toBe(12850000)
  })

  it('identifies the default wallet correctly', () => {
    const defaultWallet = mockWallets.find(w => w.isDefault) || mockWallets[0]
    expect(defaultWallet?.id).toBe('w-1')
    expect(defaultWallet?.name).toBe('BCA Main')
  })

  it('falls back to the first wallet if no default flag is present', () => {
    const nonDefaultList = mockWallets.map(w => ({ ...w, isDefault: false }))
    const defaultWallet = nonDefaultList.find(w => w.isDefault) || nonDefaultList[0]
    expect(defaultWallet?.id).toBe('w-1')
  })

  it('formats masked card numbers properly', () => {
    const formatMasked = (accountNumber?: string | null) => {
      const digits = accountNumber?.trim()
      if (!digits) return '•••• •••• •••• ••••'
      const last4 = digits.length > 4 ? digits.slice(-4) : digits.padStart(4, '0')
      return `•••• •••• •••• ${last4}`
    }

    expect(formatMasked('4829')).toBe('•••• •••• •••• 4829')
    expect(formatMasked('1234567890123456')).toBe('•••• •••• •••• 3456')
    expect(formatMasked(null)).toBe('•••• •••• •••• ••••')
    expect(formatMasked('')).toBe('•••• •••• •••• ••••')
  })

  it('correctly maps wallet selection state', () => {
    const getSelected = (id: string | 'all') => {
      return id === 'all' ? null : mockWallets.find(w => w.id === id) || null
    }

    expect(getSelected('all')).toBeNull()
    expect(getSelected('w-2')?.name).toBe('GoPay')
    expect(getSelected('unknown')).toBeNull()
  })
})
