import * as Sentry from '@sentry/nuxt'
import { throwSafeServerError } from './safeError'

export interface GeminiGenerateResponse {
  candidates?: {
    content?: {
      parts?: { text: string }[]
    }
  }[]
}

/**
 * Calls the primary Gemini model with the receipt prompt + inline image,
 * falling back to the secondary model on 429 rate limits. Errors are
 * sanitized through throwSafeServerError before leaving this module.
 */
export async function callGeminiWithFallback(
  apiKey: string,
  prompt: string,
  mimeType: string,
  base64Data: string
): Promise<GeminiGenerateResponse> {
  const callGemini = async (model: string) => {
    return await $fetch<GeminiGenerateResponse>(
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

  return response as GeminiGenerateResponse
}
