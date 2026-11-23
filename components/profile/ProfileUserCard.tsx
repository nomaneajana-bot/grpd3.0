import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { stitoTheme as t } from "@/constants/stitoTheme";

type ProfileUserCardProps = {
  name: string;
  initial: string;
  subtitle: string;
  avatarUrl?: string | null;
  onEditPress: () => void;
  onAvatarPress?: () => void;
  avatarBusy?: boolean;
};

export function ProfileUserCard({
  name,
  initial,
  subtitle,
  avatarUrl,
  onEditPress,
  onAvatarPress,
  avatarBusy = false,
}: ProfileUserCardProps) {
  return (
    <View style={styles.card} testID="profile-user-card">
      <Pressable
        onPress={onAvatarPress}
        disabled={!onAvatarPress || avatarBusy}
        accessibilityRole="button"
        accessibilityLabel={
          avatarUrl ? "Changer la photo de profil" : "Ajouter une photo de profil"
        }
        testID="profile-avatar-btn"
        style={({ pressed }) => [
          styles.avatarHit,
          pressed && onAvatarPress ? { opacity: 0.85 } : null,
        ]}
      >
        <Avatar
          name={name}
          initial={initial}
          uri={avatarUrl}
          size={56}
          testID="profile-avatar"
        />
        {onAvatarPress ? (
          <View style={styles.cameraBadge}>
            <Ionicons name="camera-outline" size={12} color={t.onPrimary} />
          </View>
        ) : null}
      </Pressable>
      <View style={styles.meta}>
        <Text style={styles.name} testID="profile-name">
          {name}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} testID="profile-subtitle">
            {subtitle}
          </Text>
        ) : null}
        {onAvatarPress ? (
          <Text style={styles.photoHint}>
            {avatarUrl ? "Appuie pour changer la photo" : "Ajouter une photo"}
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
  avatarHit: {
    position: "relative",
  },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: t.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: t.card,
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
  photoHint: {
    fontFamily: t.font.hanken.medium,
    fontSize: 12,
    color: t.primary,
    marginTop: 4,
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
