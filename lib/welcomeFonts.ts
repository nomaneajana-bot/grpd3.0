import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";

import { stitoFontAssets } from "@/lib/stitoFonts";

export const welcomeFontFamily = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

/** Loads Inter (legacy surfaces) + Space/Hanken Grotesk (Noa-Stito surfaces). */
export function useWelcomeFonts() {
  return useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...stitoFontAssets,
  });
}
