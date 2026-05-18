import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, typography } from "@/constants/ui";

type SettingsNavRowProps = {
  title: string;
  value?: string;
  destructive?: boolean;
  showChevron?: boolean;
  onPress?: () => void;
};

export function SettingsNavRow({
  title,
  value,
  destructive = false,
  showChevron = true,
  onPress,
}: SettingsNavRowProps) {
  const content = (
    <>
      <Text
        style={[styles.title, destructive && styles.titleDestructive]}
        numberOfLines={2}
      >
        {title}
      </Text>
      <View style={styles.right}>
        {value ? (
          <Text style={styles.value} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        {showChevron && onPress ? (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.text.tertiary}
          />
        ) : null}
      </View>
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
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
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: "600",
    color: colors.text.primary,
  },
  titleDestructive: {
    color: colors.accent.error,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
    maxWidth: "55%",
  },
  value: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: "right",
  },
});
