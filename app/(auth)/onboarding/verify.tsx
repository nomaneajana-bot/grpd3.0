import { type Href, router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";

import {
  OtpCodeInput,
  ResendCountdown,
} from "@/components/onboarding/OtpCodeInput";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { colors, typography } from "@/constants/ui";
import { DEMO_MODE, DEMO_OTP_CODE } from "@/lib/featureFlags";
import { formatPhoneDisplay } from "@/lib/phoneFormat";
import { useOnboarding } from "@/hooks/useOnboarding";

const DEMO_PHONE_DIGITS = "708060337";
const MOCK_OTP_CODE = "123456";

function isDemoPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.endsWith(DEMO_PHONE_DIGITS);
}

export default function OnboardingVerifyScreen() {
  const { state, setState } = useOnboarding();
  const [code, setCode] = useState(state.code ?? "");
  const [resendSec, setResendSec] = useState(24);

  useEffect(() => {
    if (resendSec <= 0) return;
    const t = setInterval(() => setResendSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendSec]);

  const phoneDisplay = state.phone
    ? formatPhoneDisplay(state.phone)
    : "+212 …";

  const simMode =
    DEMO_MODE || (!!state.phone && isDemoPhone(state.phone));
  const expectedCode = DEMO_MODE ? DEMO_OTP_CODE : MOCK_OTP_CODE;

  const subtitle = useMemo(() => {
    if (simMode) {
      return (
        <>
          Simulation — aucun SMS envoyé à{" "}
          <Text style={styles.phoneBold}>{phoneDisplay}</Text>
          {`. Entre le code ${expectedCode}.`}
        </>
      );
    }
    return (
      <>
        On a envoyé un code à{" "}
        <Text style={styles.phoneBold}>{phoneDisplay}</Text>
      </>
    );
  }, [simMode, phoneDisplay, expectedCode]);

  const handleVerify = async (value?: string) => {
    const c = (value ?? code).trim();
    if (c.length !== 6) return;
    await setState({ code: c });
    router.push("/(auth)/onboarding/profile" as Href);
  };

  const resendSlot = simMode ? (
    <Text style={styles.simResend} testID="onboarding-verify-sim-note">
      Pas de renvoi SMS — code de simulation : {expectedCode}
    </Text>
  ) : resendSec > 0 ? (
    <ResendCountdown seconds={resendSec} />
  ) : (
    <Text style={styles.resendActive} onPress={() => setResendSec(24)}>
      Renvoyer le code
    </Text>
  );

  return (
    <OnboardingScreen
      primaryLabel="Vérifier"
      onPrimaryPress={() => void handleVerify()}
      primaryDisabled={code.length !== 6}
    >
      <OnboardingTitle
        title={simMode ? "Code de simulation" : "Code reçu ?"}
        subtitle={subtitle}
      />
      <OtpCodeInput
        value={code}
        onChange={setCode}
        onComplete={(c) => void handleVerify(c)}
        resendSlot={resendSlot}
      />
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  phoneBold: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  resendActive: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "500",
  },
  simResend: {
    color: colors.text.accent,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
    textAlign: "center",
  },
});
