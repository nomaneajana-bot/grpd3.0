import { type Href, router } from "expo-router";
import React, { useState } from "react";
import { Linking, StyleSheet, Text } from "react-native";

import { CountryPhoneInput } from "@/components/onboarding/CountryPhoneInput";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { colors, typography } from "@/constants/ui";
import { useOnboarding } from "@/hooks/useOnboarding";

export default function OnboardingPhoneScreen() {
  const { setState } = useOnboarding();
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (digits.replace(/\D/g, "").length < 9) {
      setError("Entre un numéro valide.");
      return;
    }
    setError(null);
    const phone = `+212${digits.replace(/\D/g, "")}`;
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
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    lineHeight: 18,
    marginTop: 16,
  },
  link: {
    color: colors.text.secondary,
    textDecorationLine: "underline",
  },
});
