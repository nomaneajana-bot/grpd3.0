import { type Href, router } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { AuthFlowLayout } from "@/components/auth/AuthFlowLayout";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { authTheme } from "@/constants/authTheme";
import { colors, typography } from "@/constants/ui";
import { ApiError, createApiClient, loginWithEmail } from "@/lib/api";
import { getOrCreateDeviceId, storeAuthData } from "@/lib/authStore";
import { seedRunnerProfileFromAuth } from "@/lib/profileStore";

export default function EmailLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    email.trim().includes("@") && password.trim().length >= 1 && !loading;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const deviceId = await getOrCreateDeviceId();
      const client = createApiClient();
      const result = await loginWithEmail(client, {
        email: email.trim(),
        password,
        deviceId,
      });
      await storeAuthData({
        tokens: result.tokens,
        user: result.user,
        deviceId,
      });
      await seedRunnerProfileFromAuth({
        name: result.user.name ?? null,
        email: result.user.email ?? email.trim(),
      });
      router.replace("/(tabs)" as Href);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Connexion impossible.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFlowLayout progressFill={authTheme.verifyProgressFill}>
      <OnboardingScreen
        scroll
        ctaVariant="welcome"
        paddingHorizontal={authTheme.screenPaddingHorizontal}
        primaryLabel="Se connecter"
        onPrimaryPress={() => void handleLogin()}
        primaryDisabled={!canSubmit}
        primaryLoading={loading}
        secondaryLabel="Créer un compte"
        onSecondaryPress={() => router.replace("/(auth)/email-signup" as Href)}
      >
        <OnboardingTitle
          variant="auth"
          kicker="CONNEXION"
          title="Bon retour."
          titleMuted="Ton email ?"
          subtitle="Entre l’email et le mot de passe que tu as choisis à l’inscription."
        />
        <View style={styles.fields}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="toi@email.com"
            placeholderTextColor={colors.text.secondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            testID="email-login-email"
          />
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.text.secondary}
            secureTextEntry
            testID="email-login-password"
          />
        </View>
        {error ? (
          <Text style={styles.error} testID="email-login-error">
            {error}
          </Text>
        ) : null}
      </OnboardingScreen>
    </AuthFlowLayout>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 8, marginTop: 8 },
  label: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#FFFFFF",
    fontSize: typography.sizes.md,
  },
  error: {
    color: colors.text.error,
    marginTop: 12,
    fontSize: typography.sizes.sm,
  },
});
