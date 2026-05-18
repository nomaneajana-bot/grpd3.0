import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { AvatarStack } from "@/components/redesign/AvatarStack";
import { redesignTheme } from "@/constants/redesignTheme";
import { monoFontFamily } from "@/constants/redesignTheme";
import { welcomeFontFamily } from "@/lib/welcomeFonts";
import { borderRadius, colors, hairline, typography } from "@/constants/ui";
import type { ClubPaceGroupDef } from "@/lib/clubPaceGroups";

type ClubPaceGroupRowProps = {
  group: ClubPaceGroupDef;
  memberCount: number;
  sampleInitials: string[];
  isUserGroup?: boolean;
  isSelected?: boolean;
  /** Admin-configured pace label overrides default def. */
  paceLabel?: string;
  sessionsThisWeek?: number;
  onPress?: () => void;
};

export function ClubPaceGroupRow({
  group,
  memberCount,
  sampleInitials,
  isUserGroup = false,
  isSelected = false,
  paceLabel,
  sessionsThisWeek = 0,
  onPress,
}: ClubPaceGroupRowProps) {
  const countLabel =
    memberCount === 1 ? "1 membre" : `${memberCount} membres`;
  const paceText = paceLabel?.trim() || group.paceLabel;
  const sessionsLabel =
    sessionsThisWeek === 1
      ? "1 séance cette sem."
      : `${sessionsThisWeek} séances cette sem.`;
  const isInteractive = Boolean(onPress);

  const content = (
    <>
      <View style={[styles.dot, { backgroundColor: group.dotColor }]} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {group.label}
          </Text>
          {isUserGroup ? (
            <Text style={styles.toi}>TOI</Text>
          ) : null}
        </View>
        <Text style={styles.subtitle}>
          {paceText} · {countLabel} ·{" "}
          <Text style={styles.sessionsGreen}>{sessionsLabel}</Text>
        </Text>
      </View>
      <AvatarStack
        initials={sampleInitials}
        backgroundColor={group.avatarColor}
        size={26}
        overlap={8}
      />
      {isInteractive ? (
        <View style={styles.chevronBadge}>
          <Text style={styles.chevron}>›</Text>
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.row,
          isSelected && styles.rowSelected,
          pressed && styles.rowPressed,
          Platform.OS === "web" && styles.rowWeb,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.row, isSelected && styles.rowSelected]}>{content}</View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: redesignTheme.card.background,
    borderRadius: redesignTheme.card.radiusLg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    marginHorizontal: redesignTheme.screen.horizontalPadding,
    borderWidth: 1.5,
    borderColor: "transparent",
    gap: 10,
  },
  rowSelected: {
    borderColor: redesignTheme.accent.blue,
    backgroundColor: redesignTheme.accent.blueDim,
  },
  rowPressed: {
    backgroundColor: colors.background.elevated2,
    borderColor: colors.border.active,
  },
  rowWeb: {
    cursor: "pointer",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: "700",
  },
  subtitle: {
    color: redesignTheme.text.dim,
    fontSize: typography.sizes.sm,
    marginTop: 3,
  },
  sessionsGreen: {
    color: redesignTheme.accent.green,
  },
  toi: {
    fontFamily: monoFontFamily,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: redesignTheme.accent.blue,
    textTransform: "uppercase",
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
