import { z } from 'zod'

const ALLOWED_COLORS = [
  'blue',
  'emerald',
  'amber',
  'rose',
  'purple',
  'pink',
  'yellow',
  'cyan',
  'indigo',
  'slate'
] as const

const ALLOWED_ICONS = [
  'i-lucide-folder',
  'i-lucide-utensils',
  'i-lucide-car',
  'i-lucide-lightbulb',
  'i-lucide-film',
  'i-lucide-shopping-bag',
  'i-lucide-wallet',
  'i-lucide-briefcase',
  'i-lucide-trending-up',
  'i-lucide-gift',
  'i-lucide-heart-pulse',
  'i-lucide-graduation-cap',
  'i-lucide-home',
  'i-lucide-plane',
  'i-lucide-circle-help'
] as const

export const CategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
  type: z.enum(['income', 'spending']),
  icon: z.enum(ALLOWED_ICONS).optional(),
  color: z.enum(ALLOWED_COLORS).optional()
})

function isValidCalendarDate(val: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(val)
  if (!match) {
    return false
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  const d = new Date(Date.UTC(year, month - 1, day))
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
}

export const TransactionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200, 'Name too long'),
  type: z.enum(['income', 'spending']),
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(1_000_000_000_000, 'Amount is unrealistically large'),
  categoryId: z.number().int().positive('Category ID must be positive'),
  notes: z.string().max(2000, 'Notes too long').optional().nullable(),
  transactionDate: z
    .string()
    .optional()
    .refine(
      val => val === undefined || isValidCalendarDate(val),
      'Invalid transaction date'
    )
    .transform(val => (val ? new Date(val) : undefined))
    // `new Date(garbage)` yields an Invalid Date instead of throwing,
    // which would insert a broken timestamp into the database.
    .refine(
      val => val === undefined || !Number.isNaN(val.getTime()),
      'Invalid transaction date'
    )
})

export type CategoryInput = z.infer<typeof CategorySchema>
export type TransactionInput = z.infer<typeof TransactionSchema>

export const UpdateCategorySchema = CategorySchema.partial()
export const UpdateTransactionSchema = TransactionSchema.partial()

export function validateCategory(data: unknown) {
  return CategorySchema.safeParse(data)
}

export function validateTransaction(data: unknown) {
  return TransactionSchema.safeParse(data)
}

export function validateUpdateCategory(data: unknown) {
  return UpdateCategorySchema.safeParse(data)
}

export function validateUpdateTransaction(data: unknown) {
  return UpdateTransactionSchema.safeParse(data)
}
