import { type Href, router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Linking, StyleSheet, Text } from "react-native";

import { CountryPhoneInput } from "@/components/onboarding/CountryPhoneInput";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { colors, typography } from "@/constants/ui";
import { setUseMockApi } from "@/lib/authStore";
import { DEMO_MODE, DEMO_OTP_CODE } from "@/lib/featureFlags";
import { normalizePhone } from "@/lib/phone-normalize";
import { useOnboarding } from "@/hooks/useOnboarding";

const DEMO_PHONE_DIGITS = "708060337";
const MOCK_OTP_CODE = "123456";

function isDemoPhoneDigits(local: string): boolean {
  const d = local.replace(/\D/g, "");
  return d === DEMO_PHONE_DIGITS || d === `0${DEMO_PHONE_DIGITS}`;
}

export default function OnboardingPhoneScreen() {
  const { setState } = useOnboarding();
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);

  const localDigits = digits.replace(/\D/g, "");
  const simMode = DEMO_MODE || isDemoPhoneDigits(localDigits);
  const modeHint = useMemo(() => {
    if (!simMode) return null;
    return DEMO_MODE
      ? `Simulation démo · code ${DEMO_OTP_CODE} — aucun SMS réel`
      : `Simulation mock · code ${MOCK_OTP_CODE} — aucun SMS réel`;
  }, [simMode]);

  const handleContinue = async () => {
    // Connected beta: no SMS signup — send people to PIN login.
    if (!DEMO_MODE && !isDemoPhoneDigits(digits.replace(/\D/g, ""))) {
      router.replace("/(auth)/phone" as Href);
      return;
    }
    const local = digits.replace(/\D/g, "");
    if (local.length < 9) {
      setError("Entre un numéro valide.");
      return;
    }
    setError(null);
    const phone = normalizePhone(local);
    if (DEMO_MODE || isDemoPhoneDigits(local)) {
      await setUseMockApi(true);
    }
    await setState({ phone });
    router.push("/(auth)/onboarding/verify" as Href);
  };

  const pinBeta = !DEMO_MODE;

  return (
    <OnboardingScreen
      primaryLabel={
        pinBeta
          ? "J'ai déjà un compte (PIN)"
          : simMode
            ? "Continuer (simulation)"
            : "Recevoir le code"
      }
      onPrimaryPress={() => void handleContinue()}
      primaryDisabled={pinBeta ? false : digits.length < 9}
    >
      <OnboardingTitle
        title="Ton numéro"
        subtitle={
          pinBeta
            ? "Cette beta n’envoie pas de SMS. Utilise « J'ai déjà un compte » avec le PIN fourni."
            : simMode
              ? "Mode simulation — aucun SMS n’est envoyé. Entre le code indiqué ci-dessous à l’étape suivante."
              : "On t’envoie un code pour vérifier. C’est gratuit et tu peux le changer plus tard."
        }
      />
      {pinBeta ? null : (
        <CountryPhoneInput value={digits} onChange={setDigits} />
      )}
      {modeHint ? (
        <Text style={styles.modeHint} testID="onboarding-phone-sim-hint">
          {modeHint}
        </Text>
      ) : pinBeta ? (
        <Text style={styles.modeHint} testID="onboarding-phone-sim-hint">
          Beta test · 10 comptes PIN — pas d’inscription SMS
        </Text>
      ) : null}
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
  modeHint: {
    color: colors.text.accent,
    marginTop: 12,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
  },
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
