import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

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
    <View style={styles.card} testID="profile-user-card">
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.name} testID="profile-name">
          {name}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} testID="profile-subtitle">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={onEditPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Modifier le profil"
        testID="profile-edit"
        style={styles.editBtn}
      >
        <Ionicons name="pencil-outline" size={18} color={t.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: t.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
    fontFamily: t.font.space.bold,
    color: t.onPrimary,
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...t.type.cardTitle,
    fontSize: 22,
    lineHeight: 26,
    color: t.text,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    color: t.textSecondary,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: t.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
  },
});
