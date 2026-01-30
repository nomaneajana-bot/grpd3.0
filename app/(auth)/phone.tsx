import { router } from "expo-router";
import React, { useState } from "react";
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
import { createApiClient, loginWithPin, registerWithPin, registerDevice } from "../../lib/api";
import { getOrCreateDeviceId, storeAuthData } from "../../lib/authStore";
import { registerForPushNotificationsAsync } from "../../lib/notifications";

export default function PhoneScreen() {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<"login" | "register" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completeAuth = async (
    result: { tokens: { accessToken: string; refreshToken: string; expiresInSeconds: number; refreshExpiresInSeconds: number }; user: { id: string; phone: string; profileComplete: boolean } },
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
  };

  const validateInputs = (): boolean => {
    if (!phone.trim()) {
      setError("Veuillez entrer un numéro de téléphone");
      return false;
    }

    // Basic phone validation (you can enhance this)
    const phoneRegex =
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(phone.trim())) {
      setError("Numéro de téléphone invalide");
      return false;
    }

    if (!pin.trim()) {
      setError("Veuillez entrer un code à 6 chiffres");
      return false;
    }

    if (!/^\d{6}$/.test(pin.trim())) {
      setError("Le code doit contenir 6 chiffres");
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;
    setIsLoading(true);
    setAction("login");
    setError(null);
    try {
      const deviceId = await getOrCreateDeviceId();
      const client = createApiClient();
      const result = await loginWithPin(client, {
        phone: phone.trim(),
        pin: pin.trim(),
        deviceId,
      });
      await completeAuth(result, deviceId);
      router.replace("/(tabs)");
    } catch (err: unknown) {
      console.error("Login failed:", err);
      if (err instanceof Error) {
        setError(err.message || "Erreur lors de la connexion");
      } else {
        setError("Erreur lors de la connexion");
      }
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  const handleRegister = async () => {
    if (!validateInputs()) return;
    setIsLoading(true);
    setAction("register");
    setError(null);
    try {
      const deviceId = await getOrCreateDeviceId();
      const client = createApiClient();
      const result = await registerWithPin(client, {
        phone: phone.trim(),
        pin: pin.trim(),
        deviceId,
      });
      await completeAuth(result, deviceId);
      router.replace("/(tabs)");
    } catch (err: unknown) {
      console.error("Register failed:", err);
      if (err instanceof Error) {
        setError(err.message || "Erreur lors de la création");
      } else {
        setError("Erreur lors de la création");
      }
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>
          Entre ton numéro et ton code secret (6 chiffres). Pas de SMS.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="+33 6 12 34 56 78"
            placeholderTextColor={colors.text.disabled}
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setError(null);
            }}
            keyboardType="phone-pad"
            autoComplete="tel"
            autoFocus
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Code 6 chiffres"
            placeholderTextColor={colors.text.disabled}
            value={pin}
            onChangeText={(text) => {
              setPin(text.replace(/[^0-9]/g, "").slice(0, 6));
              setError(null);
            }}
            keyboardType="number-pad"
            secureTextEntry
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
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {action === "login" ? "Connexion..." : "Se connecter"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>
            {action === "register" ? "Création..." : "Créer un compte"}
          </Text>
        </TouchableOpacity>
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
    marginBottom: spacing.xl,
    lineHeight: 22,
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
  secondaryButton: {
    backgroundColor: "transparent",
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  } as ViewStyle,
  buttonDisabled: {
    opacity: 0.6,
  } as ViewStyle,
  buttonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  } as TextStyle,
  secondaryButtonText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  } as TextStyle,
});
