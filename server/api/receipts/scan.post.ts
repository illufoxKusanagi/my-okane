import { categories, type Category } from '~~/server/db/schema'
import { db } from '~~/server/db'
import type { ReceiptScanResult } from '../../utils/receiptTypes'
import * as Sentry from '@sentry/nuxt'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { checkRateLimit } from '~~/server/utils/rateLimiter'
import { matchesMagicBytes } from '~~/server/utils/imageValidation'
import { throwSafeServerError } from '~~/server/utils/safeError'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_BASE64_LENGTH = 7 * 1024 * 1024 // ~5MB file in base64

const sanitizeText = (val: string, maxLen: number): string => {
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

const receiptScanSchema = z.object({
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

export default defineEventHandler(async (event) => {
  // 1. Mandatory Pre-Auth Check (Prevent unauthenticated memory/CPU exhaustion)
  const userId = await getAuthUserId(event)

  // 2. Rate Limiting per user / IP
  await checkRateLimit(event, {
    uniqueKey: 'receipt_scan',
    windowMs: 60 * 60 * 1000,
    limit: 10,
    message: 'Receipt scanning limit reached for this hour.'
  })

  const config = useRuntimeConfig()
  const apiKey = config.geminiApiKey
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.'
    })
  }

  const body = await readBody(event)
  if (!body || !body.image || typeof body.image !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing image data in request body.'
    })
  }

  if (body.image.length > MAX_BASE64_LENGTH) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Image payload exceeds maximum allowed size (5MB).'
    })
  }

  let base64Data = body.image
  let mimeType = 'image/jpeg'

  if (base64Data.startsWith('data:')) {
    const match = base64Data.match(/^data:([^;]+);base64,(.+)$/)
    if (match && match[1] && match[2]) {
      mimeType = match[1].toLowerCase()
      base64Data = match[2]
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid data URL format.'
      })
    }
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw createError({
      statusCode: 415,
      statusMessage: `Unsupported media type "${mimeType}". Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
    })
  }

  // Verify the declared MIME type against the actual file signature (magic
  // bytes) so arbitrary payloads cannot masquerade as images.
  let imageBuffer: Buffer
  try {
    imageBuffer = Buffer.from(base64Data, 'base64')
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Image payload is not valid base64 data.'
    })
  }
  if (imageBuffer.length === 0 || !matchesMagicBytes(imageBuffer, mimeType)) {
    throw createError({
      statusCode: 415,
      statusMessage: 'File content does not match the declared image type.'
    })
  }

  const allCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
  const categoryListStr = allCategories
    .map((c: Category) => `- "${c.name}" (Type: ${c.type}, ID: ${c.id})`)
    .join('\n')

  const prompt = `You are a professional receipt parser. Analyze the uploaded receipt image and extract details to create a transaction.
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

  const callGemini = async (model: string) => {
    return await $fetch<{
      candidates?: {
        content?: {
          parts?: { text: string }[]
        }
      }[]
    }>(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey },
        body: {
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        }
      }
    )
  }

  let response
  try {
    response = await callGemini('gemini-3.6-flash')
  } catch (err: unknown) {
    const error = err as { statusCode?: number, status?: number, message?: string }
    const isRateLimit
      = error.statusCode === 429
        || error.status === 429
        || (error.message && error.message.includes('429'))
    if (isRateLimit) {
      console.warn(
        'Gemini 3.6 Flash rate limit (429) hit. Falling back to Gemini 3.5 Flash...'
      )

      try {
        response = await callGemini('gemini-3.5-flash')
      } catch (fallbackErr: unknown) {
        Sentry.captureException(fallbackErr)
        const fbError = fallbackErr as { statusCode?: number, status?: number, message?: string }
        const isFallbackRateLimit
          = fbError.statusCode === 429
            || fbError.status === 429
            || (fbError.message && fbError.message.includes('429'))
        if (isFallbackRateLimit) {
          throw createError({
            statusCode: 429,
            statusMessage:
              'Gemini API rate limit exceeded. Please wait a moment before trying to scan again.'
          })
        }
        throwSafeServerError(fallbackErr, {
          context: 'receipt scan (fallback model)',
          fallbackMessage: 'Failed to process the receipt image. Please try again.'
        })
      }
    } else {
      throwSafeServerError(err, {
        context: 'receipt scan',
        fallbackMessage: 'Failed to process the receipt image. Please try again.'
      })
    }
  }

  const textResponse = response.candidates?.[0]?.content?.parts?.[0]?.text
  if (!textResponse) {
    const emptyErr = createError({
      statusCode: 502,
      statusMessage: 'Empty response from Gemini API.'
    })
    Sentry.captureException(emptyErr)
    throw emptyErr
  }

  try {
    const rawParsed = JSON.parse(textResponse)
    const sanitizedData = receiptScanSchema.parse(rawParsed) as ReceiptScanResult

    return {
      success: true,
      data: sanitizedData
    }
  } catch (parseErr: unknown) {
    console.error('Failed to parse or validate Gemini JSON response:', textResponse)
    Sentry.captureException(parseErr, {
      extra: { textResponse }
    })
    throw createError({
      statusCode: 502,
      statusMessage: 'Invalid or malformed JSON returned by Gemini API.'
    })
  }
})
