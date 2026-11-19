import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { welcomeTheme } from "@/components/onboarding/onboardingTheme";
import { colors, typography } from "@/constants/ui";

type InviteLinkRowProps = {
  onPress?: () => void;
  preview?: string;
};

export function OrDivider() {
  return (
    <View style={dividerStyles.wrap}>
      <View style={dividerStyles.line} />
      <Text style={dividerStyles.text}>ou</Text>
      <View style={dividerStyles.line} />
    </View>
  );
}

export function InviteLinkRow({
  onPress,
  preview = "grpd.run/c/…",
}: InviteLinkRowProps) {
  return (
    <Pressable
      onPress={onPress}
      testID="onboarding-invite-link"
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
        Platform.OS === "web" && styles.web,
      ]}
    >
      <View style={styles.iconTile}>
        <Ionicons name="link-outline" size={18} color={colors.accent.primary} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>Coller un lien d’invitation</Text>
        <Text style={styles.preview}>{preview}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.text.faint} />
    </Pressable>
  );
}

const dividerStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginVertical: 22,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  text: {
    color: welcomeTheme.textMuted,
    fontSize: typography.sizes.sm,
    letterSpacing: 0.4,
  },
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 6,
  },
  pressed: {
    opacity: 0.85,
  },
  web: {
    cursor: "pointer",
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(195, 213, 179, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: "600",
  },
  preview: {
    color: welcomeTheme.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
});
