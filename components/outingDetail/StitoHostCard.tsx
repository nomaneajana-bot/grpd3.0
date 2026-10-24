import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";
import { initialsFromName } from "@/lib/homeViewModel";

type Props = {
  hostName: string;
  hostRole?: string | null;
  clubName?: string | null;
  onClubPress?: () => void;
};

export function StitoHostCard({
  hostName,
  hostRole,
  clubName,
  onClubPress,
}: Props) {
  const initials = initialsFromName(hostName) || "·";
  return (
    <View style={styles.row} testID="stito-host-card">
      <View style={styles.avatar} accessibilityLabel={`Initiales ${initials}`}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.textCol}>
        <Text style={styles.name} numberOfLines={1} testID="session-organizer-name">
          {hostName}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[hostRole, clubName].filter(Boolean).join(" · ")}
        </Text>
      </View>
      {onClubPress && clubName ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voir le club"
          onPress={onClubPress}
          style={({ pressed }) => [styles.link, pressed && { opacity: 0.85 }]}
          testID="stito-host-club-btn"
        >
          <Text style={styles.linkText}>Club →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: t.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: t.font.space.bold,
    fontSize: 14,
    color: t.onPrimary,
  },
  textCol: { flex: 1, minWidth: 0, gap: 2 },
  name: {
    fontFamily: t.font.space.bold,
    fontSize: 16,
    color: t.text,
  },
  meta: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    color: t.textSecondary,
  },
  link: { paddingVertical: 8, paddingHorizontal: 4 },
  linkText: {
    fontFamily: t.font.space.semibold,
    fontSize: 14,
    color: t.primary,
  },
});
