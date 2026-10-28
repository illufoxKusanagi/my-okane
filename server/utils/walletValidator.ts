import { z } from 'zod'
import { isValidCalendarDate } from './validator'

export const WALLET_TYPES = ['bank', 'cash', 'ewallet', 'savings', 'credit'] as const
export type WalletType = (typeof WALLET_TYPES)[number]

export const WalletSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Wallet name is required')
    .max(50, 'Wallet name must not exceed 50 characters'),
  type: z.enum(WALLET_TYPES),
  color: z.string().trim().min(1).default('emerald'),
  icon: z.string().trim().min(1).default('i-lucide-credit-card'),
  initialBalance: z
    .number()
    .int('Initial balance must be an integer')
    .min(0, 'Initial balance must be non-negative')
    .default(0),
  accountNumber: z
    .string()
    .trim()
    .refine(val => !val || /^\d{4}$/.test(val), {
      message: 'Account number must be exactly 4 digits'
    })
    .optional()
    .nullable(),
  isDefault: z.boolean().optional().default(false)
})

export const WalletUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Wallet name is required')
    .max(50, 'Wallet name must not exceed 50 characters')
    .optional(),
  type: z.enum(WALLET_TYPES).optional(),
  color: z.string().trim().min(1).optional(),
  icon: z.string().trim().min(1).optional(),
  initialBalance: z
    .number()
    .int('Initial balance must be an integer')
    .min(0, 'Initial balance must be non-negative')
    .optional(),
  accountNumber: z
    .string()
    .trim()
    .refine(val => !val || /^\d{4}$/.test(val), {
      message: 'Account number must be exactly 4 digits'
    })
    .optional()
    .nullable(),
  isDefault: z.boolean().optional()
})

export const WalletTransferSchema = z
  .object({
    sourceWalletId: z.string().trim().min(1, 'Source wallet ID is required'),
    targetWalletId: z.string().trim().min(1, 'Target wallet ID is required'),
    amount: z
      .number()
      .int('Amount must be an integer')
      .min(1, 'Amount must be at least 1')
      .max(1_000_000_000_000, 'Amount is unrealistically large'),
    notes: z.string().max(2000, 'Notes too long').optional().nullable(),
    date: z
      .string()
      .optional()
      .refine(
        val => val === undefined || isValidCalendarDate(val),
        'Invalid transfer date'
      )
      .transform(val => (val ? new Date(val) : undefined))
      .refine(
        val => val === undefined || !Number.isNaN(val.getTime()),
        'Invalid transfer date'
      )
  })
  .refine(data => data.sourceWalletId !== data.targetWalletId, {
    message: 'Source and target wallets must be different',
    path: ['targetWalletId']
  })

export type WalletInput = z.infer<typeof WalletSchema>
export type WalletUpdateInput = z.infer<typeof WalletUpdateSchema>
export type WalletTransferInput = z.infer<typeof WalletTransferSchema>

export function validateWallet(data: unknown) {
  return WalletSchema.safeParse(data)
}

export function validateWalletUpdate(data: unknown) {
  return WalletUpdateSchema.safeParse(data)
}

export function validateWalletTransfer(data: unknown) {
  return WalletTransferSchema.safeParse(data)
}
