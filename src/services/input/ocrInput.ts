
import { createWorker } from "tesseract.js";

export interface OCRResult {
  text: string;
  confidence: number;
}

let workerPromise: ReturnType<typeof createWorker> | null = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("eng")
      .catch((error) => {
        workerPromise = null;
        throw error;
      });
  }

  return workerPromise;
}

export async function extractTextFromImage(
  image: File,
): Promise<OCRResult> {
  if (!image.type.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }

  const worker = await getWorker();
  const result = await worker.recognize(image);

  return {
    text: result.data.text.trim(),
    confidence: Math.round(result.data.confidence),
  };
}

export async function terminateOCRWorker(): Promise<void> {
  if (workerPromise) {
    const worker = await workerPromise;
    workerPromise = null;
    await worker.terminate();
  }
}
