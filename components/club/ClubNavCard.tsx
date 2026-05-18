import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { redesignTheme } from "@/constants/redesignTheme";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

type ClubNavCardProps = {
  title: string;
  subtitle: string;
  icon?: keyof typeof Ionicons.glyphMap;
  badge?: number;
  onPress: () => void;
};

export function ClubNavCard({
  title,
  subtitle,
  icon = "settings-outline",
  badge,
  onPress,
}: ClubNavCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={redesignTheme.accent.blue} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {badge != null && badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : null}
      <Ionicons
        name="chevron-forward"
        size={18}
        color={redesignTheme.text.faint}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: redesignTheme.accent.blueDim,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: welcomeFontFamily.semibold,
    fontSize: 15,
    fontWeight: "600",
    color: redesignTheme.text.primary,
  },
  subtitle: {
    fontFamily: welcomeFontFamily.regular,
    fontSize: redesignTheme.type.caption.fontSize,
    color: redesignTheme.text.dim,
    marginTop: 2,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: redesignTheme.accent.blue,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
