import { type Href, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput } from "react-native";

import { AuthFlowLayout } from "@/components/auth/AuthFlowLayout";
import { ReturningDeviceBanner } from "@/components/auth/ReturningDeviceBanner";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { authTheme } from "@/constants/authTheme";
import { colors, typography } from "@/constants/ui";
import { createApiClient, requestOtp } from "@/lib/api";
import { normalizeAuthIdentifier } from "@/lib/authIdentifier";
import { isPinAuthMode } from "@/lib/authMode";
import { isSupabaseAuthEnabled } from "@/lib/supabase";
import { getAuthData, getDeviceId, setUseMockApi } from "@/lib/authStore";
import {
  clearLoginOtpRequest,
  setLoginOtpRequest,
  setLoginPhone,
} from "@/lib/loginFlowStore";
import { normalizePhone } from "@/lib/phone-normalize";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

export default function PhoneScreen() {
  const pinMode = isPinAuthMode();
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deviceRecognized, setDeviceRecognized] = useState(true);

  useEffect(() => {
    void (async () => {
      const [auth, deviceId] = await Promise.all([getAuthData(), getDeviceId()]);
      setDeviceRecognized(!!auth || !!deviceId);
    })();
  }, []);

  const canContinue = pinMode
    ? isValidPhone(identifier)
    : isValidEmail(identifier);

  const handleReceiveCode = async () => {
    if (pinMode) {
      if (!isValidPhone(identifier)) {
        setError("Entre un numéro valide (ex. 06… ou +212…).");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        await setUseMockApi(false);
        const normalised = normalizePhone(identifier.trim());
        await setLoginPhone(normalised);
        await clearLoginOtpRequest();
        router.push("/(auth)/verify" as Href);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message || "Impossible de continuer."
            : "Impossible de continuer.",
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!isValidEmail(identifier)) {
      setError("Entre un email valide.");
      return;
    }
    setError(null);
    setLoading(true);
    const normalised = normalizeAuthIdentifier(identifier);
    // Only force mock when neither Supabase nor a real API URL is configured.
    const useMock =
      !isSupabaseAuthEnabled() && !process.env.EXPO_PUBLIC_API_URL?.trim();
    try {
      await setUseMockApi(useMock);
      await setLoginPhone(normalised);
      const client = createApiClient(useMock ? { baseUrl: "" } : undefined);
      try {
        const otp = await requestOtp(client, {
          phone: normalised,
          channel: "email",
        });
        await setLoginOtpRequest({ phone: normalised, requestId: otp.requestId });
      } catch {
        // ignore — verify screen handles missing requestId
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
        primaryLabel={pinMode ? "Continuer" : "Recevoir le code"}
        onPrimaryPress={() => void handleReceiveCode()}
        primaryDisabled={!canContinue}
        primaryLoading={loading}
        secondaryLabel="Je n'ai pas encore de compte"
        onSecondaryPress={() => router.replace("/(auth)/onboarding" as Href)}
      >
        <OnboardingTitle
          variant="auth"
          kicker="CONNEXION"
          title="Bon retour."
          titleMuted={pinMode ? "Ton numéro ?" : "Ton email ?"}
          subtitle={
            pinMode
              ? "Entre le code PIN à 6 chiffres que tu as reçu pour cet environnement de test."
              : "On t'envoie un code à 6 chiffres pour confirmer."
          }
        />
        <TextInput
          style={styles.emailInput}
          value={identifier}
          onChangeText={setIdentifier}
          placeholder={pinMode ? "06 08 06 03 37" : "ton@email.com"}
          placeholderTextColor={colors.text.tertiary}
          keyboardType={pinMode ? "phone-pad" : "email-address"}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={pinMode ? "tel" : "email"}
        />
        {deviceRecognized ? <ReturningDeviceBanner /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </OnboardingScreen>
    </AuthFlowLayout>
  );
}

const styles = StyleSheet.create({
  emailInput: {
    backgroundColor: colors.background.input,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    marginTop: 16,
  },
  error: {
    color: colors.text.error,
    marginTop: 12,
    fontSize: typography.sizes.sm,
  },
});
