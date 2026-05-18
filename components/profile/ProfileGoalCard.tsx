import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { borderRadius, colors, typography } from "@/constants/ui";
import type { GoalProgress } from "@/lib/profileMetrics";

type ProfileGoalCardProps = {
  goal: GoalProgress;
  onEdit?: () => void;
};

export function ProfileGoalCard({ goal, onEdit }: ProfileGoalCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{goal.title}</Text>
        {onEdit ? (
          <Pressable onPress={onEdit} hitSlop={8}>
            <Text style={styles.editLink}>Modifier</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.subtitle}>{goal.subtitle}</Text>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.round(goal.progress * 100)}%` },
          ]}
        />
      </View>
      <View style={styles.footerRow}>
        <View>
          <Text style={styles.footerLabel}>ACTUEL</Text>
          <Text style={styles.footerValue}>{goal.currentLabel}</Text>
        </View>
        <View style={styles.footerRight}>
          <Text style={styles.footerLabel}>CIBLE</Text>
          <Text style={styles.footerTarget}>{goal.targetLabel}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 9,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: "700",
    color: colors.text.primary,
  },
  editLink: {
    fontSize: typography.sizes.sm,
    fontWeight: "600",
    color: colors.accent.primary,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  track: {
    height: 6,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface.s3,
    overflow: "hidden",
    marginBottom: 12,
  },
  fill: {
    height: "100%",
    borderRadius: borderRadius.pill,
    backgroundColor: colors.text.success,
    minWidth: 8,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerRight: {
    alignItems: "flex-end",
  },
  footerLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: "600",
    color: colors.text.secondary,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  footerValue: {
    fontSize: typography.sizes.lg,
    fontWeight: "700",
    color: colors.text.primary,
  },
  footerTarget: {
    fontSize: typography.sizes.lg,
    fontWeight: "700",
    color: colors.text.secondary,
  },
});
