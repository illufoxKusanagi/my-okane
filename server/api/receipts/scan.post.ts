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

  try {
    const response = await $fetch<{
      candidates?: {
        content?: {
          parts?: { text: string }[]
        }
      }[]
    }>(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
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

    const textResponse = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      throw createError({
        statusCode: 502,
        statusMessage: "Empty response from Gemini API."
      });
    }

    const parsedResult = JSON.parse(textResponse) as ReceiptScanResult;
    return {
      success: true,
      data: parsedResult
    };
  } catch (err: any) {
    console.error("Gemini OCR Scan Error:", err);
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || err.message || "Failed to scan receipt image."
    });
  }
});
