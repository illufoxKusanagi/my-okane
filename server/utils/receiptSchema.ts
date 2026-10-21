import { z } from 'zod'

export const sanitizeText = (val: string, maxLen: number): string => {
  if (typeof val !== 'string') return ''
  return Array.from(val)
    .filter((c) => {
      const code = c.charCodeAt(0)
      return (code >= 32 && code !== 127) || code === 10 || code === 9
    })
    .join('')
    .trim()
    .slice(0, maxLen)
}

export const receiptScanSchema = z.object({
  storeName: z
    .string()
    .transform(v => sanitizeText(v, 100))
    .default('Unknown Merchant'),
  totalAmount: z
    .number()
    .finite()
    .nonnegative()
    .max(1_000_000_000_000)
    .catch(0),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .catch(() => new Date().toISOString().slice(0, 10)),
  items: z
    .array(
      z.object({
        name: z
          .string()
          .transform(v => sanitizeText(v, 100))
          .default('Item'),
        price: z
          .number()
          .finite()
          .nonnegative()
          .max(1_000_000_000_000)
          .catch(0)
      })
    )
    .max(100)
    .catch([]),
  suggestedCategory: z
    .string()
    .nullable()
    .transform(v => (v ? sanitizeText(v, 50) : null))
    .catch(null),
  suggestedTransactionName: z
    .string()
    .transform(v => sanitizeText(v, 100))
    .default('Receipt Scan'),
  confidence: z.enum(['high', 'medium', 'low']).catch('medium')
})
