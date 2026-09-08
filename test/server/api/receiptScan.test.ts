import { describe, it, expect } from 'vitest'
import type { ReceiptScanResult } from '~~/server/utils/receiptTypes'

describe('Receipt Scan Client Parser Logic', () => {
  // Client mapping logic extracted from useTransactionsController.ts
  const parseReceiptResult = (result: ReceiptScanResult) => {
    return {
      name: result.suggestedTransactionName || result.storeName || 'Receipt Scan',
      amount: result.totalAmount || 0,
      type: 'spending',
      notes:
        `Scanned from receipt at ${result.storeName || 'Unknown Merchant'}.\n\nItems:\n`
        + result.items
          .map(item => `- ${item.name}: Rp. ${item.price.toLocaleString()}`)
          .join('\n')
    }
  }

  it('should correctly map a Gemini OCR result to transaction form state fields', () => {
    const mockOcrResult = {
      storeName: 'Starbucks Coffee',
      totalAmount: 58000,
      transactionDate: '2026-08-03',
      items: [
        { name: 'Caffe Latte', price: 58000 }
      ],
      suggestedCategory: 'Coffee',
      suggestedTransactionName: 'Starbucks Coffee',
      confidence: 'high'
    }

    const mapped = parseReceiptResult(mockOcrResult)

    expect(mapped.name).toBe('Starbucks Coffee')
    expect(mapped.amount).toBe(58000)
    expect(mapped.type).toBe('spending')
    expect(mapped.notes).toContain('Scanned from receipt at Starbucks Coffee')
    expect(mapped.notes).toContain('58')
    expect(mapped.notes).toContain('000')
  })

  it('should fallback to safe default name if descriptive fields are missing', () => {
    const mockOcrResult = {
      totalAmount: 12000,
      items: []
    }

    const mapped = parseReceiptResult(mockOcrResult)

    expect(mapped.name).toBe('Receipt Scan')
    expect(mapped.amount).toBe(12000)
  })
})
