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

import { SelectableChip } from "@/components/ui/SelectableChip";
import { Card } from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";
import { colors, spacing, typography } from "@/constants/ui";
import { useToast } from "@/hooks/useToast";
import { createApiClient, createClub } from "@/lib/api";
import type { ClubVisibility } from "@/types/api";

export default function ClubCreateScreen() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [purpose, setPurpose] = useState("");
  const [visibility, setVisibility] = useState<ClubVisibility>("public");
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
        purpose: purpose.trim() || undefined,
        visibility,
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

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Card style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nom du club</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Ex. Casa Running Club"
              placeholderTextColor={colors.text.secondary}
              autoCapitalize="words"
              editable={!isSubmitting}
              accessibilityLabel="Nom du club"
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Ville</Text>
            <TextInput
              style={styles.textInput}
              value={city}
              onChangeText={setCity}
              placeholder="Casablanca"
              placeholderTextColor={colors.text.secondary}
              autoCapitalize="words"
              editable={!isSubmitting}
              accessibilityLabel="Ville"
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Objectif du club</Text>
            <Text style={styles.fieldHint}>
              Course, marche, networking, mixte… libre.
            </Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={purpose}
              onChangeText={setPurpose}
              placeholder="Décris le but de la communauté"
              placeholderTextColor={colors.text.secondary}
              multiline
              numberOfLines={3}
              editable={!isSubmitting}
              accessibilityLabel="Objectif du club"
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Visibilité</Text>
            <View style={styles.chips}>
              <SelectableChip
                label="Public"
                selected={visibility === "public"}
                showCheckmark
                onPress={() => setVisibility("public")}
              />
              <SelectableChip
                label="Privé (membres)"
                selected={visibility === "members"}
                showCheckmark
                onPress={() => setVisibility("members")}
              />
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || isSubmitting) && styles.primaryButtonPressed,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Créer le club"
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? "Création…" : "Créer le club"}
            </Text>
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
    gap: 6,
    marginBottom: 12,
  },
  backIcon: {
    color: colors.text.primary,
    fontSize: 18,
  },
  backLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
  },
  screenTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes["2xl"],
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 48,
  },
  card: {
    gap: 4,
  },
  fieldRow: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  fieldHint: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.background.input,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: colors.accent.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: typography.sizes.base,
    fontWeight: "700",
  },
});
