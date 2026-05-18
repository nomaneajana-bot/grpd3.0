import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";

type NavRowProps = {
  title: string;
  subtitle?: string;
  onPress: () => void;
  left?: React.ReactNode;
  rightLabel?: string;
  showChevron?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function NavRow({
  title,
  subtitle,
  onPress,
  left,
  rightLabel,
  showChevron = true,
  style,
}: NavRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
        Platform.OS === "web" && styles.rowWeb,
        style,
      ]}
    >
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightLabel ? (
        <Text style={styles.rightLabel} numberOfLines={1}>
          {rightLabel}
        </Text>
      ) : null}
      {showChevron ? (
        <View style={styles.chevronBadge}>
          <Text style={styles.chevron}>›</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface.s3,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: hairline,
    borderColor: colors.border.default,
  },
  rowPressed: {
    backgroundColor: colors.background.elevated2,
    borderColor: colors.border.active,
  },
  rowWeb: {
    cursor: "pointer",
  } as ViewStyle,
  left: {
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: "600",
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: 3,
    lineHeight: 17,
  },
  rightLabel: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
    maxWidth: 72,
    textAlign: "right",
  },
  chevronBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface.s4,
    borderWidth: hairline,
    borderColor: colors.border.medium,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chevron: {
    color: colors.text.secondary,
    fontSize: 18,
    fontWeight: "600",
    marginTop: -1,
    marginLeft: 2,
  },
});
