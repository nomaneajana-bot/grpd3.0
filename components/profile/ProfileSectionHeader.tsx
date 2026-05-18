import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, typography } from "@/constants/ui";

type ProfileSectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ProfileSectionHeader({
  title,
  actionLabel,
  onAction,
}: ProfileSectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 8,
  },
  title: {
    fontSize: typography.sizes.xs,
    fontWeight: "600",
    color: colors.text.secondary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  action: {
    fontSize: typography.sizes.sm,
    fontWeight: "600",
    color: colors.accent.primary,
  },
  pressed: {
    opacity: 0.7,
  },
});
