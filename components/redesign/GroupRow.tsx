import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors, borderRadius, typography } from "@/constants/ui";

export type GroupRowVariant = "default" | "selected" | "recommended";

type GroupRowProps = {
  title: string;
  subtitle?: string;
  rightLabel?: string;
  variant?: GroupRowVariant;
  onPress?: () => void;
  children?: React.ReactNode;
  style?: ViewStyle;
};

export function GroupRow({
  title,
  subtitle,
  rightLabel,
  variant = "default",
  onPress,
  children,
  style,
}: GroupRowProps) {
  const inner = (
    <>
      <View style={styles.flex}>
        {children}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      {rightLabel ? (
        <Text style={styles.right} numberOfLines={2}>
          {rightLabel}
        </Text>
      ) : null}
    </>
  );

  const boxStyle = [
    styles.box,
    variant === "selected" && styles.sel,
    variant === "recommended" && styles.rec,
    style,
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [boxStyle, pressed && { opacity: 0.92 }]}>
        <View style={styles.row}>{inner}</View>
      </Pressable>
    );
  }

  return (
    <View style={boxStyle}>
      <View style={styles.row}>{inner}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface.s3,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginBottom: 7,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  sel: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primaryMid,
  },
  rec: {
    borderColor: colors.accent.orange,
    backgroundColor: colors.groupRow.recommendedBg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  flex: { flex: 1 },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: "600",
    color: colors.text.primary,
  },
  sub: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  right: {
    fontSize: typography.sizes.sm,
    color: colors.tag.grayText,
    marginLeft: 8,
  },
});
