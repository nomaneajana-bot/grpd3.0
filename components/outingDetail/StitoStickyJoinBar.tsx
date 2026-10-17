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
        <Text style={styles.hint} numberOfLines={1}>
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
          joined && styles.ctaJoined,
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
              name={joined ? "checkmark-circle" : "add-circle-outline"}
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
    backgroundColor: "rgba(249,249,250,0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(232,232,233,0.85)",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  hint: {
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    color: t.textSecondary,
    textAlign: "center",
  },
  cta: {
    minHeight: 48,
    borderRadius: t.radiusChip,
    backgroundColor: t.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  ctaJoined: {
    backgroundColor: t.secondaryContainer,
  },
  ctaText: {
    fontFamily: t.font.space.bold,
    fontSize: 14,
    color: t.onPrimary,
  },
  ctaTextJoined: {
    color: t.onSecondaryContainer,
  },
});
