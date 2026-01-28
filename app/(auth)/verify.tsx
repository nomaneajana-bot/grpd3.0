import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    type TextStyle,
    type ViewStyle,
} from "react-native";

import { borderRadius, colors, spacing, typography } from "../../constants/ui";
import {
    createApiClient,
    registerDevice,
    requestOtp,
    verifyOtp,
} from "../../lib/api";
import { getOrCreateDeviceId, storeAuthData } from "../../lib/authStore";
import { registerForPushNotificationsAsync } from "../../lib/notifications";

const DEFAULT_RESEND_SECONDS = 30;

export default function VerifyScreen() {
  const params = useLocalSearchParams<{
    phone?: string;
    requestId?: string;
    resendAfter?: string;
  }>();
  const phone = useMemo(() => {
    if (!params.phone) return "";
    return Array.isArray(params.phone) ? params.phone[0] : params.phone;
  }, [params.phone]);

  const requestId = useMemo(() => {
    if (!params.requestId) return undefined;
    return Array.isArray(params.requestId)
      ? params.requestId[0]
      : params.requestId;
  }, [params.requestId]);

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialResend = useMemo(() => {
    if (!params.resendAfter) return DEFAULT_RESEND_SECONDS;
    const value = Array.isArray(params.resendAfter)
      ? params.resendAfter[0]
      : params.resendAfter;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_RESEND_SECONDS;
  }, [params.resendAfter]);

  const [resendSeconds, setResendSeconds] = useState(initialResend);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(() => {
      setResendSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const handleVerify = async () => {
    if (!phone) {
      setError("Numéro de téléphone manquant");
      return;
    }

    if (code.trim().length < 4) {
      setError("Code invalide");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const deviceId = await getOrCreateDeviceId();
      const client = createApiClient();
      const result = await verifyOtp(client, {
        phone,
        code: code.trim(),
        requestId,
        deviceId,
      });

      await storeAuthData({
        tokens: result.tokens,
        user: result.user,
        deviceId,
      });

      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
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
    } catch (err: unknown) {
      console.error("Failed to verify OTP:", err);
      if (err instanceof Error) {
        setError(err.message || "Erreur lors de la vérification");
      } else {
        setError("Erreur lors de la vérification");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phone || resendSeconds > 0) return;

    setIsResending(true);
    setError(null);

    try {
      const client = createApiClient();
      await requestOtp(client, { phone, channel: "sms" });
      setResendSeconds(DEFAULT_RESEND_SECONDS);
    } catch (err: unknown) {
      console.error("Failed to resend OTP:", err);
      if (err instanceof Error) {
        setError(err.message || "Erreur lors du renvoi");
      } else {
        setError("Erreur lors du renvoi");
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Vérification</Text>
        <Text style={styles.subtitle}>Entrez le code reçu par SMS</Text>

        <Text style={styles.phoneLabel}>{phone || "Numéro inconnu"}</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="123456"
            placeholderTextColor={colors.text.disabled}
            value={code}
            onChangeText={(text) => {
              setCode(text.replace(/[^0-9]/g, "").slice(0, 6));
              setError(null);
            }}
            keyboardType="number-pad"
            autoFocus
            editable={!isLoading}
          />
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Vérification..." : "Valider"}
          </Text>
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Pas reçu ?</Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={isResending || resendSeconds > 0}
          >
            <Text style={styles.resendLink}>
              {resendSeconds > 0
                ? `Renvoyer dans ${resendSeconds}s`
                : isResending
                  ? "Renvoi..."
                  : "Renvoyer le code"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  } as ViewStyle,
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 100,
  } as ViewStyle,
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  } as TextStyle,
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
    marginBottom: spacing.lg,
    lineHeight: 22,
  } as TextStyle,
  phoneLabel: {
    color: colors.text.accent,
    fontSize: typography.sizes.base,
    marginBottom: spacing.md,
  } as TextStyle,
  inputContainer: {
    marginBottom: spacing.md,
  } as ViewStyle,
  input: {
    backgroundColor: colors.background.input,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    borderWidth: 1,
    borderColor: colors.border.default,
    textAlign: "center",
    letterSpacing: 6,
  } as TextStyle,
  errorContainer: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.accent.error + "20",
    borderRadius: borderRadius.sm,
  } as ViewStyle,
  errorText: {
    color: colors.text.error,
    fontSize: typography.sizes.sm,
  } as TextStyle,
  button: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    marginTop: spacing.md,
  } as ViewStyle,
  buttonDisabled: {
    opacity: 0.6,
  } as ViewStyle,
  buttonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  } as TextStyle,
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  } as ViewStyle,
  resendText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  } as TextStyle,
  resendLink: {
    color: colors.text.accent,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  } as TextStyle,
});
