export interface ReceiptScanResult {
  storeName: string;
  totalAmount: number;
  transactionDate: string; // ISO 8601 string or YYYY-MM-DD
  items: { name: string; price: number }[];
  suggestedCategory: string; // Needs to match one of user's categories
  suggestedTransactionName: string;
  confidence: "high" | "medium" | "low";
}
