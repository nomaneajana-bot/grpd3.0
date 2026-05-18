import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { profileTheme } from "@/constants/profileTheme";
import { colors, typography } from "@/constants/ui";

type ProfileUserCardProps = {
  name: string;
  initial: string;
  subtitle: string;
  onEditPress: () => void;
};

export function ProfileUserCard({
  name,
  initial,
  subtitle,
  onEditPress,
}: ProfileUserCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Pressable
        onPress={onEditPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Modifier le profil"
      >
        <Ionicons
          name="pencil-outline"
          size={18}
          color={colors.text.secondary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: profileTheme.cardBackground,
    borderRadius: profileTheme.cardRadius,
    padding: 16,
    marginBottom: profileTheme.cardGap,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  meta: {
    flex: 1,
  },
  name: {
    fontSize: typography.sizes.lg,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
});
