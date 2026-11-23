import React from "react";
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

type AvatarProps = {
  name?: string | null;
  initial?: string | null;
  uri?: string | null;
  size?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Circular avatar — photo when available, otherwise initials monogram.
 */
export function Avatar({
  name,
  initial,
  uri,
  size = 40,
  backgroundColor = t.primary,
  style,
  testID,
}: AvatarProps) {
  const letter =
    (initial?.trim() ||
      name
        ?.trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? "")
        .join("") ||
      "?") ||
    "?";
  const radius = size / 2;
  const fontSize = Math.max(11, Math.round(size * 0.36));
  const photo = uri?.trim() || null;

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: photo ? t.surfaceContainerLow : backgroundColor,
        },
        style,
      ]}
      testID={testID}
    >
      {photo ? (
        <Image
          source={{ uri: photo }}
          style={{ width: size, height: size, borderRadius: radius }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text style={[styles.letter, { fontSize, lineHeight: fontSize + 2 }]}>
          {letter}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  letter: {
    fontFamily: t.font.space.bold,
    color: t.onPrimary,
  },
});
