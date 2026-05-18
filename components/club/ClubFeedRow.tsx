import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Chip } from "@/components/ui/Chip";
import { redesignTheme } from "@/constants/redesignTheme";
import { welcomeFontFamily } from "@/lib/welcomeFonts";
import type { ClubFeedItem } from "@/lib/clubActivityFeed";

type ClubFeedRowProps = {
  item: ClubFeedItem;
  onPress?: () => void;
};

export function ClubFeedRow({ item, onPress }: ClubFeedRowProps) {
  const content = (
    <>
      <View style={[styles.avatar, { backgroundColor: item.color }]}>
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
        <Chip label="PR" variant="custom" style={styles.prChip} textStyle={styles.prChipText} />
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
    backgroundColor: redesignTheme.card.background,
    borderRadius: redesignTheme.card.radiusLg,
    marginBottom: 8,
    minHeight: 64,
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
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
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
    fontFamily: welcomeFontFamily.bold,
    fontWeight: "700",
    color: redesignTheme.text.primary,
  },
  what: {
    fontFamily: welcomeFontFamily.regular,
    fontWeight: "400",
    color: redesignTheme.text.dim,
  },
  when: {
    fontFamily: welcomeFontFamily.regular,
    fontSize: 11,
    color: redesignTheme.text.faint,
    marginTop: 4,
  },
  prChip: {
    backgroundColor: "rgba(240,138,58,0.15)",
    borderColor: "rgba(240,138,58,0.3)",
    alignSelf: "flex-start",
  },
  prChipText: {
    color: redesignTheme.accent.orange,
    fontSize: 10,
    fontWeight: "600",
  },
});
