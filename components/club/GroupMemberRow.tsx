import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";
import type { ClubPaceGroupId } from "@/lib/clubPaceGroups";
import { getClubPaceGroupDef } from "@/lib/clubPaceGroups";

type GroupMemberRowProps = {
  name: string;
  initials: string;
  memberSinceLabel?: string;
  groupId?: ClubPaceGroupId;
  /** Prefer this when using club color groups (not legacy A–D). */
  avatarColor?: string;
  memberUserId?: string;
  onChangePress?: () => void;
};

/**
 * Quiet roster row — whole row is the hit target when admin can move members.
 * No repeated "Changer" pills.
 */
export function GroupMemberRow({
  name,
  initials,
  memberSinceLabel,
  groupId,
  avatarColor: avatarColorProp,
  memberUserId,
  onChangePress,
}: GroupMemberRowProps) {
  const avatarColor =
    avatarColorProp ??
    (groupId ? getClubPaceGroupDef(groupId).avatarColor : t.primary);

  const body = (
    <>
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {memberSinceLabel ? (
          <Text style={styles.sub} numberOfLines={1}>
            {memberSinceLabel}
          </Text>
        ) : null}
      </View>
      {onChangePress ? <Text style={styles.chevron}>›</Text> : null}
    </>
  );

  if (onChangePress) {
    return (
      <View
        testID={
          memberUserId ? `club-group-member-${memberUserId}` : undefined
        }
      >
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          testID={
            memberUserId
              ? `club-group-member-change-${memberUserId}`
              : "club-group-member-change"
          }
          onPress={onChangePress}
          accessibilityRole="button"
          accessibilityLabel={`Changer le groupe de ${name}`}
          hitSlop={4}
        >
          {body}
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={styles.row}
      testID={
        memberUserId ? `club-group-member-${memberUserId}` : undefined
      }
    >
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    minHeight: t.touchMin,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(232,232,233,0.95)",
  },
  rowPressed: {
    opacity: 0.72,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: t.font.space.bold,
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: t.text,
    fontSize: 15,
    fontFamily: t.font.space.semibold,
  },
  sub: {
    color: t.outline,
    fontSize: 12,
    fontFamily: t.font.hanken.regular,
    marginTop: 2,
  },
  chevron: {
    color: t.outline,
    fontSize: 22,
    fontFamily: t.font.space.bold,
    paddingLeft: 4,
    lineHeight: 24,
  },
});
