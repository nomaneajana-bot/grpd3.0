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
  ApiError,
  createApiClient,
  loginWithPin,
  registerDevice,
  requestOtp,
  verifyOtp,
} from "@/lib/api";
import {
  getOrCreateDeviceId,
  shouldUseMockApi,
  storeAuthData,
} from "@/lib/authStore";
import { DEMO_MODE, DEMO_OTP_CODE } from "@/lib/featureFlags";
import {
  getLoginOtpRequest,
  getLoginPhone,
  setLoginOtpRequest,
} from "@/lib/loginFlowStore";
import { formatPhoneDisplay } from "@/lib/phoneFormat";
import { registerForPushNotificationsAsync } from "@/lib/notifications";

const MOCK_OTP_CODE = "123456";
const DEMO_PHONE_DIGITS = "708060337";

function isDemoPhone(phone: string): boolean {
  const d = phone.replace(/\D/g, "");
  return d.endsWith(DEMO_PHONE_DIGITS) || d === `0${DEMO_PHONE_DIGITS}`;
}

export default function VerifyScreen() {
  const [phone, setPhone] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [resendSec, setResendSec] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(false);
  const [otpPending, setOtpPending] = useState(false);

  useEffect(() => {
    void (async () => {
      const stored = await getLoginPhone();
      if (!stored) {
        router.replace("/(auth)/phone");
        return;
      }
      setPhone(stored);
      const mock = await shouldUseMockApi();
      setUseMock(mock);
      const otpReq = await getLoginOtpRequest();
      setOtpPending(!!otpReq?.requestId);
    })();
  }, []);

  useEffect(() => {
    if (resendSec <= 0) return;
    const t = setInterval(() => setResendSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendSec]);

  const phoneDisplay = phone ? formatPhoneDisplay(phone) : "+212 …";
  const modeHint =
    useMock && phone && isDemoPhone(phone)
      ? DEMO_MODE
        ? `Mode démo · code ${DEMO_OTP_CODE}`
        : `Mode mock · code ${MOCK_OTP_CODE}`
      : null;

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
      const deviceId = await getOrCreateDeviceId();
      const client = createApiClient(useMock ? { baseUrl: "" } : undefined);
      const otpRequest = await getLoginOtpRequest();

      if (otpRequest?.requestId) {
        // OTP was issued — verify it. Never mask a wrong code with PIN login.
        try {
          const result = await verifyOtp(client, {
            phone,
            code: c,
            requestId: otpRequest.requestId,
            deviceId,
          });
          await completeAuth(result, deviceId);
          return;
        } catch (otpErr: unknown) {
          const message =
            otpErr instanceof ApiError
              ? otpErr.message
              : otpErr instanceof Error
                ? otpErr.message
                : "Code invalide.";
          setError(message || "Code invalide.");
          return;
        }
      }

      // No OTP on file (PIN-only backend): try PIN without claiming SMS.
      const result = await loginWithPin(client, {
        phone,
        pin: c,
        deviceId,
      });
      await completeAuth(result, deviceId);
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
      const client = createApiClient(useMock ? { baseUrl: "" } : undefined);
      const otp = await requestOtp(client, { phone, channel: "sms" });
      await setLoginOtpRequest({ phone, requestId: otp.requestId });
      setOtpPending(true);
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
            useMock ? (
              <>
                Entre le code de confirmation pour{" "}
                <Text style={styles.phoneBold}>{phoneDisplay}</Text>
                {otpPending ? "" : " (code PIN si le compte existe)."}
              </>
            ) : (
              <>
                On a envoyé un code à{" "}
                <Text style={styles.phoneBold}>{phoneDisplay}</Text>
              </>
            )
          }
        />
        {modeHint ? (
          <Text style={styles.modeHint} testID="verify-mode-hint">
            {modeHint}
          </Text>
        ) : null}
        <OtpCodeInput
          value={code}
          onChange={setCode}
          onComplete={(c) => void handleVerify(c)}
          resendSlot={resendSlot}
        />
        {error ? (
          <Text style={styles.error} testID="verify-error">
            {error}
          </Text>
        ) : null}
      </OnboardingScreen>
    </AuthFlowLayout>
  );
}

const styles = StyleSheet.create({
  phoneBold: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  modeHint: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginBottom: 8,
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
