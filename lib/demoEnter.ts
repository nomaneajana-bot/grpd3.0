/**
 * Demo-only entry: seed mock auth as the canonical demo member and land on Accueil.
 * Used by `/demo` so preview links skip onboarding every time.
 */
import { createApiClient, requestOtp, verifyOtp } from "@/lib/api";
import {
  getOrCreateDeviceId,
  setUseMockApi,
  storeAuthData,
} from "@/lib/authStore";
import { DEMO_MODE, DEMO_OTP_CODE } from "@/lib/featureFlags";

/** Canonical demo phone — pre-approved into Casa club in mock world. */
export const DEMO_ENTRY_PHONE = "0708060337";

export async function enterDemoHomeSession(): Promise<void> {
  if (!DEMO_MODE) {
    throw new Error("L’entrée démo n’est disponible qu’en mode DEMO.");
  }
  await setUseMockApi(true);
  const deviceId = await getOrCreateDeviceId();
  const client = createApiClient({ baseUrl: "" });
  const otp = await requestOtp(client, { phone: DEMO_ENTRY_PHONE });
  const result = await verifyOtp(client, {
    phone: DEMO_ENTRY_PHONE,
    code: DEMO_OTP_CODE,
    requestId: otp.requestId,
    deviceId,
  });
  await storeAuthData({
    tokens: result.tokens,
    user: result.user,
    deviceId,
  });
}
