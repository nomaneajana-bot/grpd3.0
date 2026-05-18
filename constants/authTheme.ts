import { onboardingColors, welcomeTheme } from "@/components/onboarding/onboardingTheme";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

/** Returning-user login flow (CONNEXION). */
export const authTheme = {
  background: welcomeTheme.background,
  textMuted: welcomeTheme.textMuted,
  heroMutedColor: welcomeTheme.heroMutedColor,
  progressTrack: welcomeTheme.progressTrack,
  screenPaddingHorizontal: welcomeTheme.screenPaddingHorizontal,
  fontFamily: welcomeFontFamily,
  /** Step 1 of 3 — phone entry. */
  phoneProgressFill: 1 / 3,
  /** Step 2 of 3 — OTP verify. */
  verifyProgressFill: 2 / 3,
  greenSoft: onboardingColors.greenSoft,
  greenBorder: onboardingColors.greenBorder,
  greenText: onboardingColors.greenText,
  greenIconTileBg: "rgba(10, 35, 24, 0.9)",
};
