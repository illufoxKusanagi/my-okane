import { ref } from "vue";
import { type ReceiptScanResult } from "../../server/utils/receiptTypes";

export function useReceiptScan() {
  const isScanning = ref(false);
  const scanResult = ref<ReceiptScanResult | null>(null);
  const scanError = ref<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const scan = async (file: File) => {
    isScanning.value = true;
    scanError.value = null;
    scanResult.value = null;

    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size exceeds 10MB limit.");
      }

      const base64Image = await fileToBase64(file);

      const response = await $fetch<{ success: boolean; data: ReceiptScanResult }>("/api/receipts/scan", {
        method: "POST",
        body: {
          image: base64Image
        }
      });

      if (response.success && response.data) {
        scanResult.value = response.data;
        return response.data;
      } else {
        throw new Error("Failed to scan receipt.");
      }
    } catch (err: any) {
      const msg = err.statusMessage || err.message || "An error occurred while scanning.";
      scanError.value = msg;
      throw err;
    } finally {
      isScanning.value = false;
    }
  };

  return {
    isScanning,
    scanResult,
    scanError,
    scan
  };
}
