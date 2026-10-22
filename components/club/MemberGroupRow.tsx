import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { AvatarStack } from "@/components/redesign/AvatarStack";
import { stitoTheme as t } from "@/constants/stitoTheme";
import {
  memberGroupColor,
  type ClubColorGroup,
} from "@/lib/clubMemberGroups";

type MemberGroupRowProps = {
  group: ClubColorGroup;
  memberCount: number;
  sampleInitials: string[];
  isUserGroup?: boolean;
  onPress?: () => void;
};

export function MemberGroupRow({
  group,
  memberCount,
  sampleInitials,
  isUserGroup = false,
  onPress,
}: MemberGroupRowProps) {
  const color = memberGroupColor(group.colorKey);
  const countLabel =
    memberCount === 1 ? "1 membre" : `${memberCount} membres`;
  const note = group.note?.trim();

  const content = (
    <>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {group.name}
          </Text>
          {isUserGroup ? (
            <Text style={styles.toi} testID={`club-member-toi-${group.id}`}>
              TOI
            </Text>
          ) : null}
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>
          <Text testID={`club-member-count-${group.id}`}>{countLabel}</Text>
          {note ? ` · ${note}` : ""}
        </Text>
      </View>
      <AvatarStack
        initials={sampleInitials}
        backgroundColor={color}
        size={26}
        overlap={8}
      />
      {onPress ? (
        <View style={styles.chevronBadge}>
          <Text style={styles.chevron}>›</Text>
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        testID={`club-member-group-${group.id}`}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View testID={`club-member-group-${group.id}`} style={styles.row}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
  },
  pressed: { opacity: 0.85 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  content: { flex: 1, minWidth: 0 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: t.text,
    fontSize: 15,
    fontFamily: t.font.space.bold,
    flexShrink: 1,
  },
  toi: {
    color: t.onPrimary,
    backgroundColor: t.primary,
    overflow: "hidden",
    fontSize: 10,
    fontFamily: t.font.space.bold,
    letterSpacing: 0.6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subtitle: {
    color: t.textSecondary,
    fontSize: 13,
    fontFamily: t.font.hanken.regular,
    marginTop: 2,
  },
  chevronBadge: {
    marginLeft: 4,
    ...(Platform.OS === "web" ? { cursor: "pointer" as const } : null),
  },
  chevron: {
    color: t.outline,
    fontSize: 22,
    fontWeight: "300",
  },
});
