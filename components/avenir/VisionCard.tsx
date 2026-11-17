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
      <View style={styles.iconTile}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          <Tag label={badge} variant={badgeVariant} style={styles.badge} />
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    borderWidth: hairline,
    borderColor: colors.border.default,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.accent.primaryDim,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  icon: {
    fontSize: 24,
    lineHeight: 30,
  },
  body: {
    flex: 1,
    gap: 8,
    paddingTop: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  title: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 17,
    fontFamily: welcomeFontFamily.semibold,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  badge: {
    marginTop: 1,
    flexShrink: 0,
  },
  description: {
    color: colors.text.secondary,
    fontSize: 15,
    fontFamily: welcomeFontFamily.regular,
    lineHeight: 22,
  },
});
