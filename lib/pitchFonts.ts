import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
} from "@expo-google-fonts/hanken-grotesk";
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { useFonts } from "expo-font";

export const pitchFont = {
  display: {
    medium: "SpaceGrotesk_500Medium",
    semibold: "SpaceGrotesk_600SemiBold",
    bold: "SpaceGrotesk_700Bold",
  },
  body: {
    regular: "HankenGrotesk_400Regular",
    medium: "HankenGrotesk_500Medium",
  },
} as const;

/** Space Grotesk + Hanken for the pitch deck (not Inter). */
export function usePitchFonts() {
  return useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
  });
}
