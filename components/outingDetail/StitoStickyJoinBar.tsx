import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { stitoTheme as t } from "@/constants/stitoTheme";

type Props = {
  joined: boolean;
  busy?: boolean;
  primaryLabel: string;
  secondaryHint?: string;
  onPrimary: () => void;
  tabBarOffset?: number;
};

/**
 * Docked RSVP — Stitch states:
 * joined → surface-container-high + check + “Inscrit·e (Se désister)”
 * open → primary + add + “Rejoindre la sortie”
 */
export function StitoStickyJoinBar({
  joined,
  busy,
  primaryLabel,
  secondaryHint,
  onPrimary,
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
      {secondaryHint ? (
        <Text style={styles.hint} numberOfLines={2}>
          {secondaryHint}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
        onPress={onPrimary}
        disabled={busy}
        style={({ pressed }) => [
          styles.cta,
          joined ? styles.ctaJoined : styles.ctaOpen,
          pressed && { opacity: 0.92 },
          busy && { opacity: 0.7 },
        ]}
        testID="stito-join-cta"
      >
        {busy ? (
          <ActivityIndicator color={joined ? t.primary : t.onPrimary} />
        ) : (
          <>
            <Ionicons
              name={joined ? "checkmark-circle" : "add"}
              size={20}
              color={joined ? t.primary : t.onPrimary}
            />
            <Text style={[styles.ctaText, joined && styles.ctaTextJoined]}>
              {primaryLabel}
            </Text>
          </>
        )}
      </Pressable>
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
  ctaJoined: {
    backgroundColor: t.surfaceContainerHigh,
  },
  ctaText: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: t.onPrimary,
  },
  ctaTextJoined: {
    color: t.text,
  },
});
