import { router, Stack } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as Haptics from "expo-haptics";

import { Card } from "../../components/ui/Card";
import { Toast } from "../../components/ui/Toast";
import { colors, spacing } from "../../constants/ui";
import { useToast } from "../../hooks/useToast";
import { createApiClient, createClub } from "../../lib/api";

export default function ClubCreateScreen() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast("Ajoute un nom de club.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const client = createApiClient();
      await createClub(client, {
        name: name.trim(),
        city: city.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/club");
    } catch (error) {
      console.warn("Create club failed:", error);
      showToast("Impossible de créer le club. Réessaie.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={hideToast}
        />
      )}

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Retour</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Créer un club</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nom du club</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Nom du club"
              placeholderTextColor="#666"
              autoCapitalize="words"
              editable={!isSubmitting}
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Ville (optionnel)</Text>
            <TextInput
              style={styles.textInput}
              value={city}
              onChangeText={setCity}
              placeholder="Ville"
              placeholderTextColor="#666"
              autoCapitalize="words"
              editable={!isSubmitting}
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || isSubmitting) && styles.primaryButtonPressed,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.primaryButtonText}>Créer le club</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  backIcon: {
    color: colors.text.accent,
    fontSize: 18,
    marginRight: 6,
  },
  backLabel: {
    color: colors.text.accent,
    fontSize: 16,
    fontWeight: "500",
  },
  screenTitle: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  fieldRow: {
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    color: colors.text.secondary,
    fontSize: 13,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: colors.background.input,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text.primary,
    fontSize: 14,
  },
  primaryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent.primary,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryButtonPressed: {
    opacity: 0.8,
  },
  primaryButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
  },
});
