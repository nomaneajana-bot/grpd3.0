import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";

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
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
        Platform.OS === "web" && styles.web,
      ]}
    >
      <Ionicons name="link-outline" size={18} color={colors.text.secondary} />
      <View style={styles.textCol}>
        <Text style={styles.title}>Coller un lien d'invitation</Text>
        <Text style={styles.preview}>{preview}</Text>
      </View>
    </Pressable>
  );
}

const dividerStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: hairline,
    backgroundColor: colors.border.default,
  },
  text: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
  },
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.s2,
  },
  pressed: {
    opacity: 0.9,
  },
  web: {
    cursor: "pointer",
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
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
});
