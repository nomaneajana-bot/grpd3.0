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
import { createApiClient, requestOtp } from "@/lib/api";
import { getAuthData, getDeviceId, setUseMockApi } from "@/lib/authStore";
import { setLoginOtpRequest, setLoginPhone } from "@/lib/loginFlowStore";

const DEMO_PHONE = "0708060337";

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

  const handleReceiveCode = async () => {
    const local = digits.replace(/\D/g, "");
    if (local.length < 9) {
      setError("Entre un numéro valide.");
      return;
    }
    setError(null);
    setLoading(true);
    const phone = local.startsWith("0") ? `+212${local.slice(1)}` : `+212${local}`;
    const useMock = isDemoPhone(local);
    try {
      await setUseMockApi(useMock);
      await setLoginPhone(phone);
      const client = createApiClient(useMock ? { baseUrl: "" } : undefined);
      try {
        const otp = await requestOtp(client, { phone, channel: "sms" });
        await setLoginOtpRequest({ phone, requestId: otp.requestId });
      } catch {
        // PIN-only backends: verify screen falls back to loginWithPin.
      }
      router.push("/(auth)/verify" as Href);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Impossible d'envoyer le code.");
      } else {
        setError("Impossible d'envoyer le code.");
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
        primaryLabel="Recevoir le code"
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
          subtitle="On t'envoie un code pour confirmer que c'est bien toi."
        />
        <CountryPhoneInput value={digits} onChange={setDigits} />
        {deviceRecognized ? <ReturningDeviceBanner /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </OnboardingScreen>
    </AuthFlowLayout>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.text.error,
    marginTop: 12,
    fontSize: typography.sizes.sm,
  },
});
