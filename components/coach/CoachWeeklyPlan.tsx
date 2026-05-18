import React, { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
} from "react-native";

import * as Haptics from "expo-haptics";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";
import {
  buildWeeklyPlanRows,
  getWeeklySummary,
  type CoachContext,
} from "@/lib/coach";
import type { SessionData } from "@/lib/sessionData";

export type CoachWeeklyPlanProps = {
  context: CoachContext;
  sessions?: SessionData[];
  joinedIds?: Set<string>;
  workoutRunTypes?: Record<string, string>;
};

function CoachMessageText({ message }: { message: string }) {
  const parts = message.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  if (parts.length === 1 && !message.includes("**")) {
    return <Text style={styles.body}>{message}</Text>;
  }
  return (
    <Text style={styles.body}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <Text key={i} style={styles.bodyBold}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

export function CoachWeeklyPlan({
  context,
  sessions = [],
  joinedIds = new Set(),
  workoutRunTypes,
}: CoachWeeklyPlanProps) {
  const [dismissed, setDismissed] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const reply = useMemo(() => getWeeklySummary(context), [context]);

  const rows = useMemo(
    () =>
      buildWeeklyPlanRows({
        sessions,
        joinedIds,
        workoutRunTypes,
      }),
    [sessions, joinedIds, workoutRunTypes],
  );

  if (dismissed) return null;

  const onAccept = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAcknowledged(true);
  };

  const onReschedule = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDismissed(true);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>YA</Text>
        </View>
        <View style={styles.headCopy}>
          <Text style={styles.headTitle}>Coach Youssef</Text>
          <Text style={styles.headSub}>· ta semaine</Text>
        </View>
        <View style={styles.onlineDot} />
      </View>

      <CoachMessageText message={reply.message} />

      {rows.length > 0 ? (
        <View style={styles.weekBlock}>
          <Text style={styles.weekLabel}>SEMAINE SUGGÉRÉE</Text>
          {rows.map((row, i) => (
            <View
              key={`${row.dayLabel}-${i}`}
              style={[styles.weekRow, row.muted && styles.weekRowMuted]}
            >
              <View
                style={[styles.weekDot, { backgroundColor: row.dotColor }]}
              />
              <View style={styles.weekCopy}>
                <Text
                  style={[styles.weekDay, row.muted && styles.weekTextMuted]}
                >
                  {row.dayLabel}
                </Text>
                <Text
                  style={[styles.weekTitle, row.muted && styles.weekTextMuted]}
                  numberOfLines={1}
                >
                  {row.title}
                  {row.subtitle ? (
                    <Text style={styles.weekSpot}> · {row.subtitle}</Text>
                  ) : null}
                </Text>
              </View>
              {row.statusLabel ? (
                <Text
                  style={[
                    styles.weekStatus,
                    row.statusLabel === "recommandé coach" &&
                      styles.weekStatusCoach,
                    row.statusLabel === "conseil coach" &&
                      styles.weekStatusCoach,
                    row.statusLabel === "Fait" && styles.weekStatusDone,
                    row.statusLabel === "Inscrite" && styles.weekStatusJoined,
                  ]}
                >
                  {row.statusLabel}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.footerBtn,
            acknowledged && styles.footerBtnOn,
            pressed && styles.pressed,
          ]}
          onPress={onAccept}
        >
          <Text
            style={[
              styles.footerBtnTxt,
              acknowledged && styles.footerBtnTxtOn,
            ]}
          >
            {acknowledged ? "Noté" : "Ça me convient"}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.footerBtn, pressed && styles.pressed]}
          onPress={onReschedule}
        >
          <Text style={styles.footerBtnTxt}>Reprogrammer</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.coach.bg,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.coach.border,
    padding: 14,
    marginTop: 12,
    marginBottom: 4,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(94, 234, 212, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarTxt: {
    fontSize: typography.sizes.sm,
    fontWeight: "700",
    color: colors.coach.text,
  },
  headCopy: { flex: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "baseline" },
  headTitle: {
    fontSize: typography.sizes.md,
    fontWeight: "700",
    color: colors.coach.text,
  },
  headSub: {
    fontSize: typography.sizes.md,
    color: colors.coach.muted,
    marginLeft: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.coach.text,
  },
  body: {
    fontSize: typography.sizes.md,
    lineHeight: 22,
    color: colors.text.primary,
    marginBottom: 14,
  },
  bodyBold: {
    fontWeight: "700",
    color: colors.text.primary,
  } as TextStyle,
  weekBlock: { marginBottom: 14 },
  weekLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: "700",
    color: colors.coach.text,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
  },
  weekRowMuted: { opacity: 0.45 },
  weekDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  weekCopy: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  weekDay: {
    width: 32,
    fontSize: typography.sizes.sm,
    fontWeight: "700",
    color: colors.text.secondary,
  },
  weekTitle: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: "600",
  },
  weekSpot: {
    fontWeight: "400",
    color: colors.text.secondary,
  },
  weekTextMuted: { color: colors.text.tertiary },
  weekStatus: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text.secondary,
    textTransform: "lowercase",
    maxWidth: 100,
    textAlign: "right",
  },
  weekStatusCoach: { color: colors.coach.text },
  weekStatusDone: { color: colors.accent.orange },
  weekStatusJoined: { color: colors.text.accent },
  footer: { flexDirection: "row", gap: 10 },
  footerBtn: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: hairline,
    borderColor: colors.coach.border,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  footerBtnOn: {
    borderColor: colors.coach.text,
    backgroundColor: "rgba(94, 234, 212, 0.12)",
  },
  footerBtnTxt: {
    color: colors.coach.text,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
  },
  footerBtnTxtOn: { color: colors.coach.text },
  pressed: { opacity: 0.85 },
});
