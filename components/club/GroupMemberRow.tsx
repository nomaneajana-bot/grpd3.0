import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";
import type { ClubPaceGroupId } from "@/lib/clubPaceGroups";
import { getClubPaceGroupDef } from "@/lib/clubPaceGroups";

type GroupMemberRowProps = {
  name: string;
  initials: string;
  memberSinceLabel?: string;
  groupId?: ClubPaceGroupId;
  onChangePress?: () => void;
};

export function GroupMemberRow({
  name,
  initials,
  memberSinceLabel,
  groupId,
  onChangePress,
}: GroupMemberRowProps) {
  const avatarColor = groupId
    ? getClubPaceGroupDef(groupId).avatarColor
    : colors.accent.primary;

  return (
    <View style={styles.row}>
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
      {onChangePress ? (
        <Pressable
          onPress={onChangePress}
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => [
            styles.changeBtn,
            pressed && styles.changeBtnPressed,
            Platform.OS === "web" && styles.changeBtnWeb,
          ]}
        >
          <Text style={styles.changeText}>Changer</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: hairline,
    borderBottomColor: colors.border.default,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: "600",
  },
  sub: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  changeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.accent.primaryDim,
    borderWidth: hairline,
    borderColor: colors.border.active,
    flexShrink: 0,
  },
  changeBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  changeBtnWeb: {
    cursor: "pointer",
  },
  changeText: {
    color: colors.text.accent,
    fontSize: typography.sizes.sm,
    fontWeight: "700",
  },
});
