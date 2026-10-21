import { categories } from '~~/server/db/schema'
import { db } from '~~/server/db'
import type { ReceiptScanResult } from '../../utils/receiptTypes'
import * as Sentry from '@sentry/nuxt'
import { eq } from 'drizzle-orm'
import { checkRateLimit } from '~~/server/utils/rateLimiter'
import { matchesMagicBytes } from '~~/server/utils/imageValidation'
import { throwSafeServerError } from '~~/server/utils/safeError'
import { receiptScanSchema } from '~~/server/utils/receiptSchema'
import { buildReceiptPrompt } from '~~/server/utils/receiptPrompt'
import { callGeminiWithFallback } from '~~/server/utils/geminiClient'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_BASE64_LENGTH = 7 * 1024 * 1024 // ~5MB file in base64

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

  const prompt = buildReceiptPrompt(allCategories)

  let response
  try {
    response = await callGeminiWithFallback(apiKey, prompt, mimeType, base64Data)
  } catch (err: unknown) {
    // callGeminiWithFallback already throws sanitized 429/500 errors;
    // rethrow anything shaped like an H3 error untouched.
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throwSafeServerError(err, {
      context: 'receipt scan',
      fallbackMessage: 'Failed to process the receipt image. Please try again.'
    })
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
