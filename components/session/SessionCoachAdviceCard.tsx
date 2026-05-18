import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";
import { getPreSessionAdvice, type CoachContext } from "@/lib/coach";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "GR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type SessionCoachAdviceCardProps = {
  coachName?: string | null;
  coachAdvice?: string | null;
  engineContext: CoachContext;
  onAskQuestion?: () => void;
};

export function SessionCoachAdviceCard({
  coachName,
  coachAdvice,
  engineContext,
  onAskQuestion,
}: SessionCoachAdviceCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const displayName = (coachName?.trim() || "Youssef").replace(/^coach\s+/i, "");
  const initials = useMemo(() => initialsFromName(displayName), [displayName]);
  const engineLine = useMemo(
    () => getPreSessionAdvice(engineContext).message,
    [engineContext],
  );
  const body = (coachAdvice?.trim() || engineLine).trim();

  if (dismissed) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{initials}</Text>
        </View>
        <View style={styles.headCopy}>
          <Text style={styles.headTitle}>
            Coach {displayName}
            <Text style={styles.headDot}> · </Text>
            <Text style={styles.headSub}>conseil avant séance</Text>
          </Text>
        </View>
        <View style={styles.onlineDot} />
      </View>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
          onPress={() => setDismissed(true)}
        >
          <Text style={styles.btnSecondaryTxt}>Compris</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
          onPress={() => {
            onAskQuestion?.();
          }}
        >
          <Text style={styles.btnSecondaryTxt}>Poser une question</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.tag.greenBg,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: "rgba(77, 217, 144, 0.45)",
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
    backgroundColor: "rgba(77, 217, 144, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarTxt: {
    fontSize: typography.sizes.sm,
    fontWeight: "700",
    color: colors.tag.greenText,
  },
  headCopy: { flex: 1 },
  headTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: "700",
    color: colors.tag.greenText,
  },
  headSub: {
    fontWeight: "500",
    color: colors.text.secondary,
  },
  headDot: { color: colors.text.secondary, fontWeight: "400" },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tag.greenText,
  },
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
    borderColor: "rgba(77, 217, 144, 0.5)",
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  pressed: { opacity: 0.85 },
  btnSecondaryTxt: {
    color: colors.tag.greenText,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
  },
});
