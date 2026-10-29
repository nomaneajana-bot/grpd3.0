import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { stitoTheme as t } from "@/constants/stitoTheme";

type SettingsNavRowProps = {
  title: string;
  value?: string;
  destructive?: boolean;
  showChevron?: boolean;
  /** Non-actionable stub — no chevron, muted value "Bientôt" */
  comingSoon?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
};

export function SettingsNavRow({
  title,
  value,
  destructive = false,
  showChevron = true,
  comingSoon = false,
  onPress,
  onLongPress,
}: SettingsNavRowProps) {
  const displayValue = comingSoon ? value ?? "Bientôt" : value;
  const actionable = Boolean(onPress || onLongPress) && !comingSoon;

  const content = (
    <>
      <Text
        style={[
          styles.title,
          destructive && styles.titleDestructive,
          comingSoon && styles.titleMuted,
        ]}
        numberOfLines={2}
      >
        {title}
      </Text>
      <View style={styles.right}>
        {displayValue ? (
          <Text
            style={[styles.value, comingSoon && styles.valueMuted]}
            numberOfLines={1}
          >
            {displayValue}
          </Text>
        ) : null}
        {showChevron && actionable ? (
          <Ionicons name="chevron-forward" size={18} color={t.outline} />
        ) : null}
      </View>
    </>
  );

  if (!actionable) {
    return (
      <View
        style={styles.row}
        accessibilityState={{ disabled: true }}
        accessibilityHint={comingSoon ? "Bientôt disponible" : undefined}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={600}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 8,
    backgroundColor: t.card,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: t.font.space.semibold,
    color: t.text,
  },
  titleDestructive: {
    color: t.error,
  },
  titleMuted: {
    color: t.textSecondary,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
    maxWidth: "55%",
  },
  value: {
    fontSize: 14,
    fontFamily: t.font.hanken.regular,
    color: t.textSecondary,
    textAlign: "right",
  },
  valueMuted: {
    color: t.outline,
    fontStyle: "italic",
  },
});
