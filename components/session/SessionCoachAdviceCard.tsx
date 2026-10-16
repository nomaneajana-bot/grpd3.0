import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type SessionCoachAdviceCardProps = {
  /** Real organizer name — never invent a coach persona. */
  coachName?: string | null;
  /** User-entered purpose / note — required to show this card. */
  coachAdvice?: string | null;
  /** @deprecated Ignored — no invented coach engine copy on community outings. */
  engineContext?: unknown;
  onAskQuestion?: () => void;
};

/**
 * Organizer note for a community outing.
 * Only renders when there is a real note. No “Coach Youssef”, no invented advice.
 */
export function SessionCoachAdviceCard({
  coachName,
  coachAdvice,
  onAskQuestion,
}: SessionCoachAdviceCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const note = coachAdvice?.trim() || "";
  const displayName = coachName?.trim() || "";
  const initials = useMemo(
    () => initialsFromName(displayName || "Organisateur"),
    [displayName],
  );

  if (dismissed || !note) return null;

  return (
    <View style={styles.wrap} testID="session-organizer-note">
      <View style={styles.headRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{initials}</Text>
        </View>
        <View style={styles.headCopy}>
          <Text style={styles.headTitle}>
            {displayName || "Organisateur"}
            <Text style={styles.headDot}> · </Text>
            <Text style={styles.headSub}>note pour la sortie</Text>
          </Text>
        </View>
      </View>
      <Text style={styles.body}>{note}</Text>
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
          onPress={() => setDismissed(true)}
          accessibilityRole="button"
          accessibilityLabel="Compris"
        >
          <Text style={styles.btnSecondaryTxt}>Compris</Text>
        </Pressable>
        {onAskQuestion ? (
          <Pressable
            style={({ pressed }) => [
              styles.btnSecondary,
              pressed && styles.pressed,
            ]}
            onPress={() => onAskQuestion()}
            accessibilityRole="button"
            accessibilityLabel="Contacter l'organisateur"
          >
            <Text style={styles.btnSecondaryTxt}>Contacter</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    padding: 14,
    marginBottom: 12,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.sageDim,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarTxt: {
    fontSize: typography.sizes.sm,
    fontWeight: "700",
    color: colors.accent.primary,
  },
  headCopy: { flex: 1 },
  headTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: "700",
    color: colors.text.primary,
  },
  headSub: {
    fontWeight: "500",
    color: colors.text.secondary,
  },
  headDot: { color: colors.text.secondary, fontWeight: "400" },
  body: {
    fontSize: typography.sizes.md,
    lineHeight: 22,
    color: colors.text.primary,
    marginBottom: 12,
  },
  actions: { flexDirection: "row", gap: 10 },
  btnSecondary: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: hairline,
    borderColor: colors.border.default,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.background.elevated,
  },
  pressed: { opacity: 0.85 },
  btnSecondaryTxt: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
  },
});
