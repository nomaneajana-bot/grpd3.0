/**
 * Optional profile photo picker — web file input, compressed square JPEG.
 * Returns a data URL or null if cancelled / unavailable.
 */

import { Platform } from "react-native";

const MAX_EDGE = 512;
const JPEG_QUALITY = 0.78;
const MAX_BYTES = 320_000;

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

async function compressSquare(dataUrl: string): Promise<string> {
  if (typeof document === "undefined") return dataUrl;

  const img = document.createElement("img");
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Image invalide"));
    img.src = dataUrl;
  });

  const side = Math.min(img.width, img.height, MAX_EDGE);
  const sx = Math.max(0, Math.floor((img.width - Math.min(img.width, img.height)) / 2));
  const sy = Math.max(0, Math.floor((img.height - Math.min(img.width, img.height)) / 2));
  const sourceSide = Math.min(img.width, img.height);

  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, sx, sy, sourceSide, sourceSide, 0, 0, side, side);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

function estimateBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.floor((b64.length * 3) / 4);
}

/** Opens a system image picker. Resolves with a data URL, or null if cancelled. */
export async function pickProfilePhoto(): Promise<string | null> {
  if (Platform.OS !== "web" || typeof document === "undefined") {
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
    const compressed = await compressSquare(raw);
    if (estimateBytes(compressed) > MAX_BYTES) {
      throw new Error("Photo trop lourde — essaie une image plus légère.");
    }
    return compressed;
  } finally {
    input.remove();
  }
}
