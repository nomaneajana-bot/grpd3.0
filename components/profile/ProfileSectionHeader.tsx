import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

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
    ...t.type.labelSm,
    color: t.textSecondary,
    textTransform: "uppercase",
  },
  action: {
    fontSize: 12,
    fontFamily: t.font.space.bold,
    color: t.primary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
});
