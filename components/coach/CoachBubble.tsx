import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";

export type CoachBubbleProps = {
  coachName?: string;
  title?: string;
  context: string;
  message?: string;
  isLoading?: boolean;
  children?: React.ReactNode;
};

export function CoachBubble({
  coachName,
  title,
  context,
  message,
  isLoading,
  children,
}: CoachBubbleProps) {
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={styles.headerRow}>
        <View style={styles.dot} />
        <View style={styles.headerText}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <Text style={styles.kicker}>{context}</Text>
          {coachName ? (
            <Text style={styles.coachName}>{coachName}</Text>
          ) : null}
        </View>
      </View>
      {isLoading ? (
        <ActivityIndicator color={colors.coach.text} style={{ marginVertical: 8 }} />
      ) : message ? (
        <Text style={styles.body}>{message}</Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.coach.bg,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.coach.border,
    padding: 14,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.coach.text,
    marginRight: 8,
  },
  headerText: { flex: 1 },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 2,
  },
  kicker: {
    fontSize: typography.sizes.xs,
    fontWeight: "700",
    color: colors.coach.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  coachName: {
    fontSize: typography.sizes.sm,
    color: colors.coach.muted,
    marginTop: 2,
  },
  body: {
    fontSize: typography.sizes.md,
    lineHeight: 22,
    color: colors.text.primary,
  },
});
