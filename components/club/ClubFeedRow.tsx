import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Chip } from "@/components/ui/Chip";
import { stitoTheme as t } from "@/constants/stitoTheme";
import type { ClubFeedItem } from "@/lib/clubActivityFeed";

type ClubFeedRowProps = {
  item: ClubFeedItem;
  onPress?: () => void;
};

export function ClubFeedRow({ item, onPress }: ClubFeedRowProps) {
  const content = (
    <>
      <View style={[styles.avatar, { backgroundColor: item.color || t.primary }]}>
        <Text style={styles.avatarText}>{item.initials}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.line} numberOfLines={2}>
          <Text style={styles.who}>{item.who}</Text>
          <Text style={styles.what}> {item.what}</Text>
        </Text>
        <Text style={styles.when}>{item.when}</Text>
      </View>
      {item.kind === "pr" ? (
        <Chip
          label="PR"
          variant="custom"
          style={styles.prChip}
          textStyle={styles.prChipText}
        />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.row}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    marginBottom: 8,
    minHeight: 64,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
  },
  pressed: {
    opacity: 0.85,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: t.onPrimary,
    fontSize: 13,
    fontFamily: t.font.space.bold,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  line: {
    fontSize: 13,
    lineHeight: 18,
  },
  who: {
    fontFamily: t.font.space.bold,
    color: t.text,
  },
  what: {
    fontFamily: t.font.hanken.regular,
    color: t.textSecondary,
  },
  when: {
    fontFamily: t.font.hanken.regular,
    fontSize: 11,
    color: t.outline,
    marginTop: 4,
  },
  prChip: {
    backgroundColor: "rgba(245,120,64,0.12)",
    borderColor: "rgba(245,120,64,0.3)",
    alignSelf: "flex-start",
  },
  prChipText: {
    color: "#C45A1A",
    fontSize: 10,
    fontWeight: "600",
  },
});
