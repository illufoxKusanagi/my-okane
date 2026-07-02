import { categories, type Category } from "~~/server/db/schema";
import { db } from "~~/server/db";
import { type ReceiptScanResult } from "../../utils/receiptTypes";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file."
    });
  }

  const body = await readBody(event);
  if (!body || !body.image) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing image data in request body."
    });
  }

  // Parse the data URL if present
  let base64Data = body.image;
  let mimeType = "image/jpeg";

  if (base64Data.startsWith("data:")) {
    const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid data URL format."
      });
    }
  }

  // Fetch all existing categories to pass to Gemini for classification
  const allCategories = await db.select().from(categories);
  const categoryListStr = allCategories
    .map((c: Category) => `- "${c.name}" (Type: ${c.type}, ID: ${c.id})`)
    .join("\n");

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

Provide ONLY the raw JSON string matching this schema. Do not wrap it in markdown code blocks like \`\`\`json.`;

  // Helper function to call the Gemini API
  const callGemini = async (model: string) => {
    return await $fetch<{
      candidates?: {
        content?: {
          parts?: { text: string }[]
        }
      }[]
    }>(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
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
          responseMimeType: "application/json"
        }
      }
    });
  };

  let response;
  try {
    // Try first with gemini-2.0-flash
    response = await callGemini("gemini-2.0-flash");
  } catch (err: any) {
    const isRateLimit = err.statusCode === 429 || err.status === 429 || (err.message && err.message.includes("429"));
    if (isRateLimit) {
      console.warn("Gemini 2.0 Flash rate limit (429) hit. Falling back to Gemini 1.5 Flash after a short delay...");
      
      // Wait 1.5 seconds before retrying to allow rate-limits to settle
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      try {
        response = await callGemini("gemini-1.5-flash");
      } catch (fallbackErr: any) {
        const isFallbackRateLimit = fallbackErr.statusCode === 429 || fallbackErr.status === 429 || (fallbackErr.message && fallbackErr.message.includes("429"));
        if (isFallbackRateLimit) {
          throw createError({
            statusCode: 429,
            statusMessage: "Gemini API rate limit exceeded. Please wait a moment before trying to scan again."
          });
        }
        throw fallbackErr;
      }
    } else {
      throw err;
    }
  }

  const textResponse = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) {
    throw createError({
      statusCode: 502,
      statusMessage: "Empty response from Gemini API."
    });
  }

  try {
    const parsedResult = JSON.parse(textResponse) as ReceiptScanResult;
    return {
      success: true,
      data: parsedResult
    };
  } catch (parseErr) {
    console.error("Failed to parse Gemini JSON response:", textResponse);
    throw createError({
      statusCode: 502,
      statusMessage: "Invalid JSON format returned by Gemini API."
    });
  }
});
