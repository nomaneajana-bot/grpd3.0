import { type Href, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { AuthFlowLayout } from "@/components/auth/AuthFlowLayout";
import { ReturningDeviceBanner } from "@/components/auth/ReturningDeviceBanner";
import { CountryPhoneInput } from "@/components/onboarding/CountryPhoneInput";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { authTheme } from "@/constants/authTheme";
import { colors, typography } from "@/constants/ui";
import { ApiError, createApiClient, requestOtp } from "@/lib/api";
import { getAuthData, getDeviceId, setUseMockApi } from "@/lib/authStore";
import { DEMO_MODE, DEMO_OTP_CODE } from "@/lib/featureFlags";
import {
  clearLoginOtpRequest,
  setLoginOtpRequest,
  setLoginPhone,
} from "@/lib/loginFlowStore";

const DEMO_PHONE = "0708060337";
/** Explicit mock (non-DEMO) OTP for the dedicated test phone — not 000000. */
const MOCK_OTP_CODE = "123456";

function isDemoPhone(digits: string): boolean {
  const d = digits.replace(/\D/g, "");
  return d === DEMO_PHONE || d === DEMO_PHONE.slice(1);
}

export default function PhoneScreen() {
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deviceRecognized, setDeviceRecognized] = useState(true);

  useEffect(() => {
    void (async () => {
      const [auth, deviceId] = await Promise.all([getAuthData(), getDeviceId()]);
      setDeviceRecognized(!!auth || !!deviceId);
    })();
  }, []);

  const localDigits = digits.replace(/\D/g, "");
  const useMockTransport = DEMO_MODE || isDemoPhone(localDigits);
  const modeHint = !useMockTransport
    ? null
    : DEMO_MODE
      ? `Mode démo · code ${DEMO_OTP_CODE}`
      : isDemoPhone(localDigits)
        ? `Mode mock · code ${MOCK_OTP_CODE}`
        : null;

  const handleReceiveCode = async () => {
    const local = digits.replace(/\D/g, "");
    if (local.length < 9) {
      setError("Entre un numéro valide.");
      return;
    }
    setError(null);
    setLoading(true);
    const phone = local.startsWith("0")
      ? `+212${local.slice(1)}`
      : `+212${local}`;
    // Explicit mock only: DEMO_MODE or dedicated demo phone — never silent fallback.
    const useMock = DEMO_MODE || isDemoPhone(local);
    try {
      await setUseMockApi(useMock);
      await setLoginPhone(phone);
      const client = createApiClient(useMock ? { baseUrl: "" } : undefined);
      try {
        const otp = await requestOtp(client, { phone, channel: "sms" });
        await setLoginOtpRequest({ phone, requestId: otp.requestId });
      } catch (otpErr: unknown) {
        if (otpErr instanceof ApiError && otpErr.code === "MISSING_API_URL") {
          throw otpErr;
        }
        // PIN-only backends: no OTP request on file → verify may try PIN.
        await clearLoginOtpRequest();
      }
      router.push("/(auth)/verify" as Href);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === "MISSING_API_URL") {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message || "Impossible de préparer le code.");
      } else {
        setError("Impossible de préparer le code.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFlowLayout progressFill={authTheme.phoneProgressFill}>
      <OnboardingScreen
        scroll
        ctaVariant="welcome"
        paddingHorizontal={authTheme.screenPaddingHorizontal}
        primaryLabel="Continuer"
        onPrimaryPress={() => void handleReceiveCode()}
        primaryDisabled={digits.replace(/\D/g, "").length < 9}
        primaryLoading={loading}
        secondaryLabel="Je n'ai pas encore de compte"
        onSecondaryPress={() => router.replace("/(auth)/onboarding" as Href)}
      >
        <OnboardingTitle
          variant="auth"
          kicker="CONNEXION"
          title="Bon retour."
          titleMuted="Ton numéro ?"
          subtitle={
            useMockTransport
              ? "Un code de confirmation sera préparé pour ce numéro (aucun SMS réel en mock/démo)."
              : "On t'envoie un code pour confirmer que c'est bien toi."
          }
        />
        <CountryPhoneInput value={digits} onChange={setDigits} />
        {modeHint ? (
          <Text style={styles.modeHint} testID="login-mode-hint">
            {modeHint}
          </Text>
        ) : null}
        {deviceRecognized ? <ReturningDeviceBanner /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </OnboardingScreen>
    </AuthFlowLayout>
  );
}

const styles = StyleSheet.create({
  modeHint: {
    color: colors.text.secondary,
    marginTop: 12,
    fontSize: typography.sizes.sm,
  },
  error: {
    color: colors.text.error,
    marginTop: 12,
    fontSize: typography.sizes.sm,
  },
});
