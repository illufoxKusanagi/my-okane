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
