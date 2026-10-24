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
