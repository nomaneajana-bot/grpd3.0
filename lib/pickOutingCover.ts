/**
 * Optional outing cover picker — web file input; native uses a hidden
 * document-style prompt via the same web path when available.
 * Returns a compressed data URL (or null if cancelled / failed).
 */

import { Platform } from "react-native";

const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.72;
const MAX_BYTES = 550_000;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture impossible"));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Lecture impossible"));
        return;
      }
      resolve(result);
    };
    reader.readAsDataURL(file);
  });
}

async function compressDataUrl(dataUrl: string): Promise<string> {
  if (typeof document === "undefined") return dataUrl;

  const img = document.createElement("img");
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Image invalide"));
    img.src = dataUrl;
  });

  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

function estimateBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.floor((b64.length * 3) / 4);
}

/**
 * Opens a system image picker. Resolves with a data URL, or null if cancelled.
 */
export async function pickOutingCover(): Promise<string | null> {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    // Native: keep optional — no hard dependency on expo-image-picker yet.
    return null;
  }

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.style.display = "none";
  document.body.appendChild(input);

  try {
    const file = await new Promise<File | null>((resolve) => {
      const cleanup = () => {
        input.onchange = null;
        input.oncancel = null;
      };
      input.onchange = () => {
        const next = input.files?.[0] ?? null;
        cleanup();
        resolve(next);
      };
      input.oncancel = () => {
        cleanup();
        resolve(null);
      };
      input.click();
    });

    if (!file) return null;
    if (!file.type.startsWith("image/")) {
      throw new Error("Choisis une image (JPG, PNG…).");
    }

    const raw = await readFileAsDataUrl(file);
    const compressed = await compressDataUrl(raw);
    if (estimateBytes(compressed) > MAX_BYTES) {
      throw new Error("Photo trop lourde — essaie une image plus légère.");
    }
    return compressed;
  } finally {
    input.remove();
  }
}
