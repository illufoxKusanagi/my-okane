export type WalletType = 'bank' | 'cash' | 'ewallet' | 'savings' | 'credit'

export interface Wallet {
  id: string
  userId?: string
  name: string
  type: WalletType
  accountNumber?: string | null
  color: string
  icon: string
  initialBalance: number
  isDefault: boolean
  createdAt: string | Date
}

export interface WalletWithBalance extends Wallet {
  balance: number
}

export interface CreateWalletPayload {
  name: string
  type: WalletType
  color?: string
  icon?: string
  initialBalance?: number
  accountNumber?: string | null
  isDefault?: boolean
}

export interface UpdateWalletPayload {
  name?: string
  type?: WalletType
  color?: string
  icon?: string
  initialBalance?: number
  accountNumber?: string | null
  isDefault?: boolean
}

export interface TransferFundsPayload {
  sourceWalletId: string
  targetWalletId: string
  amount: number
  notes?: string | null
  date?: string | Date
}

export interface Transaction {
  id: string
  name: string
  type: 'income' | 'spending'
  amount: number
  notes?: string | null
  transactionDate: string | Date
  categoryId: string
  categoryName?: string
  categoryIcon?: string
  categoryColor?: string
  walletId?: string | null
  transferWalletId?: string | null
  createdAt: string | Date
}

export interface Category {
  id: string
  name: string
  type: 'income' | 'spending'
  icon?: string | null
  color?: string | null
}

export interface CategoryData {
  label: string
  value: number
  color: string
}
