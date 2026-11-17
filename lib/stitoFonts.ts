/**
 * Noa-Stito typography — Space Grotesk (display/labels) + Hanken Grotesk (body).
 * Bundled via @expo-google-fonts (SIL OFL). See assets/fonts/README.md.
 */
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from "@expo-google-fonts/hanken-grotesk";
import { useFonts } from "expo-font";

export const stitoFont = {
  space: {
    regular: "SpaceGrotesk_400Regular",
    medium: "SpaceGrotesk_500Medium",
    semibold: "SpaceGrotesk_600SemiBold",
    bold: "SpaceGrotesk_700Bold",
  },
  hanken: {
    regular: "HankenGrotesk_400Regular",
    medium: "HankenGrotesk_500Medium",
    semibold: "HankenGrotesk_600SemiBold",
    bold: "HankenGrotesk_700Bold",
  },
} as const;

export const stitoFontAssets = {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
};

export function useStitoFonts() {
  return useFonts(stitoFontAssets);
}
