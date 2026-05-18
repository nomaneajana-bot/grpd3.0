import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, typography } from "@/constants/ui";
import type { GroupPolicyMode } from "@/lib/clubAdminStore";
import {
  clubDefaultPolicyInfoText,
  interGroupModeLabel,
} from "@/lib/interGroupPolicy";

type InterGroupPolicyInfoBoxProps = {
  variant: "club_default" | "locked" | "warn" | "free" | "custom";
  title?: string;
  body?: string;
  mode?: GroupPolicyMode;
};

export function InterGroupPolicyInfoBox({
  variant,
  title,
  body,
  mode,
}: InterGroupPolicyInfoBoxProps) {
  const isOrange = variant === "locked" || variant === "club_default" && mode === "locked";
  const isGreen =
    variant === "warn" ||
    variant === "free" ||
    (variant === "club_default" && mode !== "locked");

  const resolvedTitle =
    title ??
    (variant === "club_default" && mode
      ? `Mode actuel : ${interGroupModeLabel(mode)}`
      : variant === "locked"
        ? "Accès verrouillé"
        : "Information");

  const resolvedBody =
    body ??
    (variant === "club_default" && mode
      ? clubDefaultPolicyInfoText(mode)
      : "");

  if (!resolvedBody && variant === "custom") return null;

  return (
    <View
      style={[
        styles.box,
        isOrange ? styles.boxOrange : styles.boxGreen,
      ]}
    >
      <Text style={styles.icon}>{isOrange ? "🔒" : "ℹ️"}</Text>
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            isOrange ? styles.titleOrange : styles.titleGreen,
          ]}
        >
          {resolvedTitle}
        </Text>
        {resolvedBody ? (
          <Text style={styles.body}>{resolvedBody}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: 12,
  },
  boxOrange: {
    backgroundColor: colors.accent.orangeDim,
    borderColor: "rgba(245, 120, 42, 0.35)",
  },
  boxGreen: {
    backgroundColor: colors.tag.greenBg,
    borderColor: "rgba(77, 217, 144, 0.35)",
  },
  icon: {
    fontSize: 16,
    marginTop: 2,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: "700",
    marginBottom: 4,
  },
  titleOrange: {
    color: colors.accent.orange,
  },
  titleGreen: {
    color: colors.text.success,
  },
  body: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: 18,
  },
});
