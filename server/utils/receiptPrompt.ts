import type { Category } from '~~/server/db/schema'
import { sanitizeText } from './receiptSchema'

export function buildReceiptPrompt(categories: Category[]): string {
  const categoryListStr = categories
    .map((c: Category) => {
      const safeName = sanitizeText(c.name, 50).replace(/"/g, '\'')
      return `- "${safeName}" (Type: ${c.type}, ID: ${c.id})`
    })
    .join('\n')

  return `You are a professional receipt parser. Analyze the uploaded receipt image and extract details to create a transaction.
You must return a valid JSON object matching the schema below.

List of available categories in the system:
${categoryListStr}

JSON schema target:
{
  "storeName": "Name of the merchant or store",
  "totalAmount": 15000 (total transaction amount, integer number only),
  "transactionDate": "YYYY-MM-DD" (date on the receipt, format YYYY-MM-DD, fallback to today's date if not found),
  "items": [
    { "name": "Item name", "price": 10000 }
  ],
  "suggestedCategory": "The exact name of one of the available categories listed above. Choose the most appropriate match. If it is a spending receipt, map only to one of the spending categories. If it is an income receipt, map only to one of the income categories. If unsure, map to 'Others' or a general spending category.",
  "suggestedTransactionName": "Short descriptive name for the transaction, e.g., 'Lunch at McD', 'Starbucks Coffee', 'Indomaret Groceries'",
  "confidence": "high" | "medium" | "low"
}

Provide ONLY the raw JSON string matching this schema. Do not wrap it in markdown code blocks like \`\`\`json.`
}
