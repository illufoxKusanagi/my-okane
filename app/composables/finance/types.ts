export interface Transaction {
  id: number
  name: string
  type: 'income' | 'spending'
  amount: number
  notes?: string | null
  transactionDate: string | Date
  categoryId: number
  categoryName?: string
  categoryIcon?: string
  categoryColor?: string
  createdAt: string | Date
}

export interface Category {
  id: number
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
