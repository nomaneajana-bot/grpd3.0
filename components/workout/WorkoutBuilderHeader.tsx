import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { redesignTheme } from "@/constants/redesignTheme";
import { monoFontFamily } from "@/constants/redesignTheme";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

type WorkoutBuilderHeaderProps = {
  onBack: () => void;
  draftSaved?: boolean;
};

export function WorkoutBuilderHeader({
  onBack,
  draftSaved = false,
}: WorkoutBuilderHeaderProps) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Retour"
      >
        <Text style={styles.backChevron}>‹</Text>
      </Pressable>
      <View style={styles.spacer} />
      {draftSaved ? (
        <View style={styles.draftBadge}>
          <View style={styles.draftDot} />
          <Text style={styles.draftText}>BROUILLON ENREGISTRÉ</Text>
        </View>
      ) : (
        <View style={styles.draftPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    paddingTop: 4,
    paddingBottom: 8,
    minHeight: 48,
  },
  backBtn: {
    width: redesignTheme.backButton.size,
    height: redesignTheme.backButton.size,
    borderRadius: redesignTheme.backButton.size / 2,
    backgroundColor: redesignTheme.backButton.background,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
  },
  backChevron: {
    color: redesignTheme.text.primary,
    fontSize: 28,
    lineHeight: 30,
    marginTop: -2,
    fontFamily: welcomeFontFamily.semibold,
  },
  spacer: {
    flex: 1,
  },
  draftBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  draftDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: redesignTheme.accent.green,
  },
  draftText: {
    fontFamily: monoFontFamily,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: redesignTheme.text.dim,
  },
  draftPlaceholder: {
    width: 1,
    height: 1,
  },
});
