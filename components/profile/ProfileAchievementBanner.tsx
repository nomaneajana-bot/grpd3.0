import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, typography } from "@/constants/ui";

type ProfileAchievementBannerProps = {
  kmYtd: number;
  body: string;
};

export function ProfileAchievementBanner({
  kmYtd,
  body,
}: ProfileAchievementBannerProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{`${kmYtd} km depuis janvier`}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.accent.orangeDim,
    borderRadius: borderRadius.lg,
    padding: 13,
    marginBottom: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#3A2010",
  },
  heading: {
    fontSize: typography.sizes.lg,
    fontWeight: "700",
    color: colors.accent.orange,
    marginBottom: 4,
  },
  body: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});
