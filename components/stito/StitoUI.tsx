/**
 * Shared light Stito chrome for Clubs / Create / Organise / Invitations / Profile.
 * Mirrors ExperienceUI patterns on stitoTheme tokens (no dark canvas).
 */
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

export const stitoChrome = t;

export function StitoAction({
  label,
  onPress,
  secondary = false,
  disabled = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={[
        stitoUi.action,
        secondary && stitoUi.secondaryAction,
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text style={[stitoUi.actionText, secondary && stitoUi.secondaryActionText]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function StitoBack({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Retour"
      onPress={onPress}
      style={stitoUi.back}
      hitSlop={8}
      testID="stito-back"
    >
      {/* Text chevron — Ionicons private-use glyphs show as tofu in web a11y trees. */}
      <Text style={stitoUi.backChevron}>‹</Text>
    </Pressable>
  );
}

export const stitoUi = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.canvas },
  content: {
    padding: 24,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 960,
    alignSelf: "center",
    gap: 20,
  },
  eyebrow: {
    ...t.type.labelSm,
    color: t.primary,
    textTransform: "uppercase",
    fontFamily: t.font.space.bold,
  },
  title: {
    ...t.type.pageTitle,
    color: t.text,
  },
  heading: {
    ...t.type.section,
    color: t.text,
  },
  body: {
    fontFamily: t.font.hanken.regular,
    fontSize: 15,
    lineHeight: 22,
    color: t.textSecondary,
  },
  card: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
  },
  input: {
    color: t.text,
    backgroundColor: t.surfaceContainerLow,
    borderWidth: 1,
    borderColor: t.outlineVariant,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    fontFamily: t.font.hanken.regular,
  },
  label: {
    color: t.text,
    fontSize: 12,
    fontFamily: t.font.space.bold,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  chip: {
    borderRadius: t.radiusChip,
    borderWidth: 1,
    borderColor: t.outlineVariant,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: t.surfaceContainerLow,
  },
  chipOn: {
    backgroundColor: t.primary,
    borderColor: t.primary,
  },
  chipText: {
    color: t.textSecondary,
    fontSize: 13,
    fontFamily: t.font.space.semibold,
  },
  chipTextOn: {
    color: t.onPrimary,
  },
  action: {
    backgroundColor: t.primary,
    padding: 17,
    borderRadius: 16,
    alignItems: "center",
  },
  secondaryAction: {
    backgroundColor: t.card,
    borderWidth: 1,
    borderColor: t.outlineVariant,
  },
  actionText: {
    color: t.onPrimary,
    fontSize: 15,
    fontFamily: t.font.space.bold,
  },
  secondaryActionText: {
    color: t.text,
  },
  back: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.95)",
    borderRadius: 30,
    backgroundColor: t.card,
  },
  backChevron: {
    fontFamily: t.font.space.bold,
    fontSize: 28,
    lineHeight: 30,
    color: t.text,
    marginTop: -2,
  },
});
