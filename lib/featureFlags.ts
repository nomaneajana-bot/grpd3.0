/** When true, unauthenticated users enter `/(auth)/onboarding` instead of legacy phone screen. */
export const ONBOARDING_V2 = true;

/**
 * Jury / offline prototype mode.
 * When true, the client always uses the mock API (`lib/api/mock.ts`)
 * regardless of `EXPO_PUBLIC_API_URL`.
 */
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === "true";

/** OTP accepted for any phone when DEMO_MODE is on. */
export const DEMO_OTP_CODE = "000000";
