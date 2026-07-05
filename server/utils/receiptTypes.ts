export interface ReceiptScanResult {
  storeName: string;
  totalAmount: number;
  transactionDate: string;
  items: { name: string; price: number }[];
  suggestedCategory: string;
  suggestedTransactionName: string;
  confidence: "high" | "medium" | "low";
}
