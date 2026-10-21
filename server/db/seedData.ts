export interface SeedCategoryInput {
  name: string
  type: 'income' | 'spending'
  icon: string
  color: string
}

export interface SeedTransactionInput {
  name: string
  type: 'income' | 'spending'
  amount: number
  notes: string
  transactionDate: Date
  category: { name: string, type: 'income' | 'spending' }
}

export const SEED_CATEGORIES: SeedCategoryInput[] = [
  {
    name: 'Food',
    type: 'spending',
    icon: 'i-lucide-utensils',
    color: 'amber'
  },
  {
    name: 'Transport',
    type: 'spending',
    icon: 'i-lucide-car',
    color: 'blue'
  },
  {
    name: 'Utilities',
    type: 'spending',
    icon: 'i-lucide-lightbulb',
    color: 'yellow'
  },
  {
    name: 'Entertainment',
    type: 'spending',
    icon: 'i-lucide-film',
    color: 'purple'
  },
  {
    name: 'Shopping',
    type: 'spending',
    icon: 'i-lucide-shopping-bag',
    color: 'pink'
  },
  {
    name: 'Others',
    type: 'spending',
    icon: 'i-lucide-circle-help',
    color: 'slate'
  },
  {
    name: 'Salary',
    type: 'income',
    icon: 'i-lucide-wallet',
    color: 'emerald'
  },
  {
    name: 'Freelance',
    type: 'income',
    icon: 'i-lucide-briefcase',
    color: 'cyan'
  },
  {
    name: 'Investments',
    type: 'income',
    icon: 'i-lucide-trending-up',
    color: 'indigo'
  },
  {
    name: 'Others',
    type: 'income',
    icon: 'i-lucide-circle-help',
    color: 'slate'
  }
]

export const SEED_TRANSACTIONS: SeedTransactionInput[] = [
  {
    name: 'Monthly Salary',
    type: 'income',
    amount: 15000000,
    notes: 'June payroll',
    transactionDate: new Date('2026-06-01T08:00:00Z'),
    category: { name: 'Salary', type: 'income' }
  },
  {
    name: 'Office Lunch',
    type: 'spending',
    amount: 75000,
    notes: 'Nasi padang',
    transactionDate: new Date('2026-06-02T12:30:00Z'),
    category: { name: 'Food', type: 'spending' }
  },
  {
    name: 'Weekly Gasoline',
    type: 'spending',
    amount: 150000,
    notes: 'Full tank',
    transactionDate: new Date('2026-06-03T18:00:00Z'),
    category: { name: 'Transport', type: 'spending' }
  },
  {
    name: 'Electricity & Water',
    type: 'spending',
    amount: 850000,
    notes: 'Utilities bill',
    transactionDate: new Date('2026-06-05T09:00:00Z'),
    category: { name: 'Utilities', type: 'spending' }
  },
  {
    name: 'Weekend Cinema',
    type: 'spending',
    amount: 120000,
    notes: '2 tickets + popcorn',
    transactionDate: new Date('2026-06-10T19:30:00Z'),
    category: { name: 'Entertainment', type: 'spending' }
  },
  {
    name: 'Freelance Landing Page',
    type: 'income',
    amount: 4500000,
    notes: 'Payment from client A',
    transactionDate: new Date('2026-06-15T10:00:00Z'),
    category: { name: 'Freelance', type: 'income' }
  },
  {
    name: 'Grocery Shopping',
    type: 'spending',
    amount: 450000,
    notes: 'Monthly stock',
    transactionDate: new Date('2026-06-18T15:00:00Z'),
    category: { name: 'Shopping', type: 'spending' }
  },
  {
    name: 'Cafe Coffee',
    type: 'spending',
    amount: 65000,
    notes: 'Starbucks meeting',
    transactionDate: new Date('2026-06-20T14:00:00Z'),
    category: { name: 'Food', type: 'spending' }
  },
  {
    name: 'Grab Car Ride',
    type: 'spending',
    amount: 50000,
    notes: 'To office',
    transactionDate: new Date('2026-06-25T08:30:00Z'),
    category: { name: 'Transport', type: 'spending' }
  },
  {
    name: 'Monthly Salary',
    type: 'income',
    amount: 15000000,
    notes: 'July payroll',
    transactionDate: new Date('2026-07-01T08:00:00Z'),
    category: { name: 'Salary', type: 'income' }
  },
  {
    name: 'Netflix Subscription',
    type: 'spending',
    amount: 186000,
    notes: 'Premium plan',
    transactionDate: new Date('2026-07-01T10:00:00Z'),
    category: { name: 'Entertainment', type: 'spending' }
  },
  {
    name: 'Team Dinner',
    type: 'spending',
    amount: 250000,
    notes: 'Shared cost',
    transactionDate: new Date('2026-07-02T19:00:00Z'),
    category: { name: 'Food', type: 'spending' }
  }
]
