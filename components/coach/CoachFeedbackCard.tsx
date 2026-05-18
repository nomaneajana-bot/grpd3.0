import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import * as Haptics from "expo-haptics";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";
import { buildCoachContext, getPostSessionFeedback } from "@/lib/coach";
import type { SessionData } from "@/lib/sessionData";
import {
  getLastCoachFeedback,
  saveCoachFeedback,
  type CoachSessionRating,
} from "@/lib/coachFeedbackStore";

import { CoachBubble } from "./CoachBubble";

export type CoachFeedbackCardProps = {
  sessions?: SessionData[];
  joinedIds?: Set<string>;
  userGroup?: string;
  lastSessionType?: string;
};

export function CoachFeedbackCard({
  sessions = [],
  joinedIds = new Set(),
  userGroup,
  lastSessionType,
}: CoachFeedbackCardProps) {
  const [msg, setMsg] = useState<string | undefined>(undefined);
  const [last, setLast] = useState<CoachSessionRating | null>(null);

  const load = useCallback(async () => {
    const v = await getLastCoachFeedback();
    setLast(v?.rating ?? null);
    if (v?.rating) {
      const ctx = buildCoachContext({
        screen: "profile",
        sessions,
        joinedIds,
        userGroup,
        lastSessionType,
        feedback: v,
      });
      setMsg(getPostSessionFeedback(v.rating, ctx).message);
    }
  }, [sessions, joinedIds, userGroup, lastSessionType]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRate = async (rating: CoachSessionRating) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await saveCoachFeedback(rating);
    setLast(rating);
    const ctx = buildCoachContext({
      screen: "profile",
      sessions,
      joinedIds,
      userGroup,
      lastSessionType,
      feedback: { rating, savedAt: Date.now() },
    });
    setMsg(getPostSessionFeedback(rating, ctx).message);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        Comment s&apos;est passée ta dernière séance ?
      </Text>
      <CoachBubble
        context="Retour coach"
        message={msg ?? "Choisis une option pour ajuster les prochaines séances."}
      />
      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={() => onRate("trop_facile")}>
          <Text style={[styles.btnTxt, last === "trop_facile" && styles.btnTxtOn]}>
            Trop facile
          </Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => onRate("juste_bien")}>
          <Text style={[styles.btnTxt, last === "juste_bien" && styles.btnTxtOn]}>
            Juste bien
          </Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => onRate("trop_dur")}>
          <Text style={[styles.btnTxt, last === "trop_dur" && styles.btnTxtOn]}>
            Trop dur
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16, marginBottom: 24 },
  title: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  row: { flexDirection: "row", gap: 8, marginTop: 10 },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: hairline,
    borderColor: colors.border.default,
    alignItems: "center",
    backgroundColor: colors.surface.s2,
  },
  btnTxt: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
  },
  btnTxtOn: { color: colors.coach.text },
});
