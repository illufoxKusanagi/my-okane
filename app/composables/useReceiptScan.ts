import { ref } from "vue";
import { type ReceiptScanResult } from "../../server/utils/receiptTypes";

const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.75): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Only compress images
    if (!file.type.startsWith("image/")) {
      return resolve(file);
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);

      let width = img.width;
      let height = img.height;

      // Calculate new dimensions to maintain aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return resolve(file);
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }
          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = (err) => {
      reject(err);
    };
  });
};

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
      console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      
      // 1. Compress image to prevent Payload Too Large (413) errors
      const compressedFile = await compressImage(file).catch((err) => {
        console.warn("Failed to compress image, falling back to original file:", err);
        return file;
      });

      console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);

      if (compressedFile.size > 10 * 1024 * 1024) {
        throw new Error("File size exceeds 10MB limit.");
      }

      const base64Image = await fileToBase64(compressedFile);

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
