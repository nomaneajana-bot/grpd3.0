import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, Text } from "react-native";

import { AuthFlowLayout } from "@/components/auth/AuthFlowLayout";
import {
  OtpCodeInput,
  ResendCountdown,
} from "@/components/onboarding/OtpCodeInput";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { authTheme } from "@/constants/authTheme";
import { colors, typography } from "@/constants/ui";
import {
  createApiClient,
  loginWithPin,
  registerDevice,
  requestOtp,
  verifyOtp,
} from "@/lib/api";
import {
  getOrCreateDeviceId,
  setUseMockApi,
  shouldUseMockApi,
  storeAuthData,
} from "@/lib/authStore";
import {
  getLoginOtpRequest,
  getLoginPhone,
  setLoginOtpRequest,
} from "@/lib/loginFlowStore";
import { formatPhoneDisplay } from "@/lib/phoneFormat";
import { registerForPushNotificationsAsync } from "@/lib/notifications";

export default function VerifyScreen() {
  const [phone, setPhone] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [resendSec, setResendSec] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const stored = await getLoginPhone();
      if (!stored) {
        router.replace("/(auth)/phone");
        return;
      }
      setPhone(stored);
    })();
  }, []);

  useEffect(() => {
    if (resendSec <= 0) return;
    const t = setInterval(() => setResendSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendSec]);

  const phoneDisplay = phone ? formatPhoneDisplay(phone) : "+212 …";

  const completeAuth = async (
    result: {
      tokens: {
        accessToken: string;
        refreshToken: string;
        expiresInSeconds: number;
        refreshExpiresInSeconds: number;
      };
      user: { id: string; phone: string; profileComplete: boolean };
    },
    deviceId: string,
  ) => {
    await storeAuthData({
      tokens: result.tokens,
      user: result.user,
      deviceId,
    });
    try {
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) {
        const client = createApiClient();
        await registerDevice(client, {
          deviceId,
          platform:
            Platform.OS === "ios"
              ? "ios"
              : Platform.OS === "android"
                ? "android"
                : "web",
          pushToken,
        });
      }
    } catch (deviceError) {
      console.warn("Device registration failed:", deviceError);
    }
    router.replace("/(tabs)");
  };

  const handleVerify = async (value?: string) => {
    const c = (value ?? code).trim();
    if (c.length !== 6 || !phone) return;
    setLoading(true);
    setError(null);
    try {
      const useMock = await shouldUseMockApi();
      const deviceId = await getOrCreateDeviceId();
      const client = createApiClient(useMock ? { baseUrl: "" } : undefined);
      const otpRequest = await getLoginOtpRequest();
      try {
        const result = await verifyOtp(client, {
          phone,
          code: c,
          requestId: otpRequest?.requestId,
          deviceId,
        });
        await completeAuth(result, deviceId);
        return;
      } catch {
        const result = await loginWithPin(client, {
          phone,
          pin: c,
          deviceId,
        });
        await completeAuth(result, deviceId);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Code invalide.");
      } else {
        setError("Code invalide.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phone || resendSec > 0) return;
    setResendSec(24);
    try {
      const useMock = await shouldUseMockApi();
      const client = createApiClient(useMock ? { baseUrl: "" } : undefined);
      const otp = await requestOtp(client, { phone, channel: "sms" });
      await setLoginOtpRequest({ phone, requestId: otp.requestId });
    } catch {
      // ignore — countdown still resets
    }
  };

  if (!phone) {
    return null;
  }

  const resendSlot =
    resendSec > 0 ? (
      <ResendCountdown seconds={resendSec} />
    ) : (
      <Text style={styles.resendActive} onPress={() => void handleResend()}>
        Renvoyer le code
      </Text>
    );

  return (
    <AuthFlowLayout progressFill={authTheme.verifyProgressFill}>
      <OnboardingScreen
        primaryLabel="Vérifier"
        onPrimaryPress={() => void handleVerify()}
        primaryDisabled={code.length !== 6}
        primaryLoading={loading}
        paddingHorizontal={authTheme.screenPaddingHorizontal}
        ctaVariant="welcome"
      >
        <OnboardingTitle
          variant="auth"
          kicker="CONNEXION"
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
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </OnboardingScreen>
    </AuthFlowLayout>
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
  error: {
    color: colors.text.error,
    marginTop: 12,
    fontSize: typography.sizes.sm,
  },
});
