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
import { createApiClient, requestOtp } from "../../lib/api";
import { getOrCreateDeviceId } from "../../lib/authStore";

export default function PhoneScreen() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!phone.trim()) {
      setError("Veuillez entrer un numéro de téléphone");
      return;
    }

    // Basic phone validation (you can enhance this)
    const phoneRegex =
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(phone.trim())) {
      setError("Numéro de téléphone invalide");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await getOrCreateDeviceId();
      const client = createApiClient();

      const result = await requestOtp(client, {
        phone: phone.trim(),
        channel: "sms",
      });

      // Navigate to verify screen with phone number
      router.push({
        pathname: "/(auth)/verify",
        params: {
          phone: phone.trim(),
          requestId: result.requestId,
          resendAfter: String(result.resendAfterSeconds),
        },
      });
    } catch (err: unknown) {
      console.error("Failed to request OTP:", err);
      if (err instanceof Error) {
        // Check if it's a network/API configuration error
        if (
          err.message.includes("Not found") ||
          err.message.includes("Failed to fetch")
        ) {
          setError(
            "API non configurée. Veuillez définir EXPO_PUBLIC_API_URL dans votre fichier .env",
          );
        } else {
          setError(err.message || "Erreur lors de l'envoi du code");
        }
      } else {
        setError("Erreur lors de l'envoi du code");
      }
    } finally {
      setIsLoading(false);
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
          Entrez votre numéro de téléphone pour recevoir un code de vérification
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

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSendCode}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Envoi..." : "Envoyer le code"}
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
  buttonDisabled: {
    opacity: 0.6,
  } as ViewStyle,
  buttonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  } as TextStyle,
});
