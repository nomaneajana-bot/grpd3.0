import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { Tag, type TagVariant } from "@/components/redesign/Tag";
import { borderRadius, colors, hairline } from "@/constants/ui";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

export type VisionCardProps = {
  icon: string;
  title: string;
  description: string;
  badge: string;
  badgeVariant: TagVariant;
  /** Stagger index for entrance animation (0-based). */
  index?: number;
};

export function VisionCard({
  icon,
  title,
  description,
  badge,
  badgeVariant,
  index = 0,
}: VisionCardProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(180 + index * 70)
        .duration(520)
        .springify()
        .damping(18)}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.iconTile}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <Tag label={badge} variant={badgeVariant} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    borderWidth: hairline,
    borderColor: colors.border.default,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accent.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 22,
    lineHeight: 28,
  },
  title: {
    color: colors.text.primary,
    fontSize: 18,
    fontFamily: welcomeFontFamily.semibold,
    letterSpacing: -0.3,
  },
  description: {
    color: colors.text.secondary,
    fontSize: 15,
    fontFamily: welcomeFontFamily.regular,
    lineHeight: 22,
    marginTop: -2,
  },
});
