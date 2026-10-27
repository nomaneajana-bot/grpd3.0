import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { stitoTheme as t } from "@/constants/stitoTheme";

type Props = {
  joined: boolean;
  busy?: boolean;
  /** Open (not joined) primary CTA — e.g. Rejoindre la sortie */
  primaryLabel: string;
  secondaryHint?: string;
  onPrimary: () => void;
  /** Joined-only: open cancel confirmation (never conflated with status). */
  onCancelParticipation?: () => void;
  tabBarOffset?: number;
};

/**
 * Docked RSVP — clear hierarchy:
 * open → primary “Rejoindre la sortie”
 * joined → calm status “Tu es inscrit·e” + separate “Annuler ma participation”
 * (never one button that is both status and destructive)
 */
export function StitoStickyJoinBar({
  joined,
  busy,
  primaryLabel,
  secondaryHint,
  onPrimary,
  onCancelParticipation,
  tabBarOffset = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, 12) + tabBarOffset },
      ]}
      testID="stito-sticky-join"
    >
      {secondaryHint && !joined ? (
        <Text style={styles.hint} numberOfLines={2}>
          {secondaryHint}
        </Text>
      ) : null}

      {joined ? (
        <View style={styles.joinedWrap} testID="stito-joined-status">
          <View style={styles.statusRow}>
            <Ionicons name="checkmark-circle" size={22} color={t.primary} />
            <Text style={styles.statusText}>Tu es inscrit·e</Text>
          </View>
          {onCancelParticipation ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Annuler ma participation"
              onPress={onCancelParticipation}
              disabled={busy}
              style={({ pressed }) => [
                styles.cancelLink,
                pressed && { opacity: 0.75 },
                busy && { opacity: 0.6 },
              ]}
              testID="stito-join-cta"
            >
              {busy ? (
                <ActivityIndicator color={t.textSecondary} />
              ) : (
                <Text style={styles.cancelLinkText}>
                  Annuler ma participation
                </Text>
              )}
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={primaryLabel}
          onPress={onPrimary}
          disabled={busy}
          style={({ pressed }) => [
            styles.cta,
            styles.ctaOpen,
            pressed && { opacity: 0.92 },
            busy && { opacity: 0.7 },
          ]}
          testID="stito-join-cta"
        >
          {busy ? (
            <ActivityIndicator color={t.onPrimary} />
          ) : (
            <>
              <Ionicons name="add" size={20} color={t.onPrimary} />
              <Text style={styles.ctaText}>{primaryLabel}</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(249,249,250,0.96)",
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
  },
  hint: {
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.textSecondary,
    textAlign: "center",
  },
  joinedWrap: {
    gap: 10,
    alignItems: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    width: "100%",
    borderRadius: 8,
    backgroundColor: "rgba(0,95,52,0.1)",
    paddingHorizontal: 16,
  },
  statusText: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: t.primary,
  },
  cancelLink: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 40,
    justifyContent: "center",
  },
  cancelLinkText: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 14,
    color: t.textSecondary,
    textDecorationLine: "underline",
  },
  cta: {
    minHeight: 48,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  ctaOpen: {
    backgroundColor: t.primary,
  },
  ctaText: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: t.onPrimary,
  },
});
