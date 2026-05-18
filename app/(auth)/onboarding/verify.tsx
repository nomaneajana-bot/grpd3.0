import { type Href, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import {
  OtpCodeInput,
  ResendCountdown,
} from "@/components/onboarding/OtpCodeInput";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { colors } from "@/constants/ui";
import { useOnboarding } from "@/hooks/useOnboarding";
import { formatPhoneDisplay } from "@/lib/phoneFormat";

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

  const handleVerify = async (value?: string) => {
    const c = (value ?? code).trim();
    if (c.length !== 6) return;
    await setState({ code: c });
    router.push("/(auth)/onboarding/profile" as Href);
  };

  const resendSlot =
    resendSec > 0 ? (
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
        title="Code reçu ?"
        subtitle={
          <>
            On a envoyé un code à{" "}
            <Text style={styles.phoneBold}>{phoneDisplay}</Text>
          </>
        }
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
});
