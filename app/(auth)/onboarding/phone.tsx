import { type Href, router } from "expo-router";
import React, { useState } from "react";
import { Linking, StyleSheet, Text } from "react-native";

import { CountryPhoneInput } from "@/components/onboarding/CountryPhoneInput";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { colors, typography } from "@/constants/ui";
import { setUseMockApi } from "@/lib/authStore";
import { DEMO_MODE } from "@/lib/featureFlags";
import { normalizePhone } from "@/lib/phone-normalize";
import { useOnboarding } from "@/hooks/useOnboarding";

const DEMO_PHONE_DIGITS = "708060337";

function isDemoPhoneDigits(local: string): boolean {
  const d = local.replace(/\D/g, "");
  return d === DEMO_PHONE_DIGITS || d === `0${DEMO_PHONE_DIGITS}`;
}

export default function OnboardingPhoneScreen() {
  const { setState } = useOnboarding();
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    const local = digits.replace(/\D/g, "");
    if (local.length < 9) {
      setError("Entre un numéro valide.");
      return;
    }
    setError(null);
    const phone = normalizePhone(local);
    // Same rule as returning-login: dedicated mock phone / DEMO → mock transport.
    if (DEMO_MODE || isDemoPhoneDigits(local)) {
      await setUseMockApi(true);
    }
    await setState({ phone });
    router.push("/(auth)/onboarding/verify" as Href);
  };

  return (
    <OnboardingScreen
      primaryLabel="Recevoir le code"
      onPrimaryPress={() => void handleContinue()}
      primaryDisabled={digits.length < 9}
    >
      <OnboardingTitle
        title="Ton numéro"
        subtitle="On t'envoie un code pour vérifier. C'est gratuit et tu peux le changer plus tard."
      />
      <CountryPhoneInput value={digits} onChange={setDigits} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.legal}>
        En continuant, tu acceptes nos{" "}
        <Text
          style={styles.link}
          onPress={() => void Linking.openURL("https://grpd.run/terms")}
        >
          Conditions
        </Text>{" "}
        et notre{" "}
        <Text
          style={styles.link}
          onPress={() => void Linking.openURL("https://grpd.run/privacy")}
        >
          Confidentialité
        </Text>
        .
      </Text>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.text.error,
    marginTop: 10,
    fontSize: typography.sizes.sm,
  },
  legal: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: 18,
    marginTop: 16,
  },
  link: {
    color: colors.accent.sage,
    textDecorationLine: "underline",
  },
});
