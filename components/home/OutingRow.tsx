import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { homeTheme as h } from "@/constants/homeTheme";
import {
  activityLabel,
  formatTimeLabel,
} from "@/lib/homeViewModel";
import type { SessionData } from "@/lib/sessionData";

type OutingRowProps = {
  session: SessionData;
  onPress: () => void;
  /** Hairline below (Stitch editorial list). */
  showRule?: boolean;
};

function formatDiscoveryDay(session: SessionData): string {
  const iso = session.dateISO;
  if (iso && /^\d{4}-\d{2}-\d{2}/.test(iso)) {
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const days = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
    const months = [
      "janv.",
      "févr.",
      "mars",
      "avr.",
      "mai",
      "juin",
      "juil.",
      "août",
      "sept.",
      "oct.",
      "nov.",
      "déc.",
    ];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  }
  return (session.dateLabel || "").replace(/\s+\d{1,2}:\d{2}.*/, "").trim();
}

/** Stitch editorial discovery row — typography + hairline, not a card. */
export function OutingRow({
  session,
  onPress,
  showRule = true,
}: OutingRowProps) {
  const host =
    session.coachName?.trim() || session.hostGroupName?.trim() || null;
  const spot = session.meetingPoint?.trim() || session.spot?.trim() || "";
  const time = formatTimeLabel(session.timeMinutes);
  const dist =
    session.estimatedDistanceKm > 0
      ? `${String(session.estimatedDistanceKm).replace(".", ",")} km`
      : null;
  const pace =
    session.targetPace &&
    session.targetPace !== "—" &&
    !/^0:00/i.test(session.targetPace)
      ? session.targetPace.startsWith("Allure")
        ? session.targetPace
        : `Allure ${session.targetPace}`
      : "Allure libre";
  const openBit =
    session.visibility === "public" || session.visibility == null
      ? "Ouverte"
      : null;
  const rightMeta = [pace, dist || openBit].filter(Boolean).join(" · ");

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Voir ${session.title}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          pressed && { backgroundColor: "rgba(243,243,244,0.4)" },
        ]}
        testID={`home-outing-row-${session.id}`}
      >
        <View style={styles.whenRow}>
          <Text style={styles.discipline} numberOfLines={1}>
            {activityLabel(session)} · {formatDiscoveryDay(session)}
          </Text>
          {time ? <Text style={styles.time}>{time}</Text> : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {session.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta} numberOfLines={1}>
            {[host, spot].filter(Boolean).join(" · ")}
          </Text>
          {rightMeta ? (
            <Text style={styles.metaRight} numberOfLines={1}>
              {rightMeta}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {showRule ? <View style={styles.rule} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: h.space.md,
    paddingHorizontal: 4,
    borderRadius: 12,
    gap: 6,
  },
  whenRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  discipline: {
    fontFamily: h.font.hanken.semibold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(63,73,65,0.8)",
    flexShrink: 1,
  },
  time: {
    fontFamily: h.font.hanken.medium,
    fontSize: 10,
    lineHeight: 13,
    color: h.outline,
  },
  title: {
    fontFamily: h.font.space.semibold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: h.text,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 2,
  },
  meta: {
    ...h.type.meta,
    color: h.textSecondary,
    flexShrink: 1,
  },
  metaRight: {
    fontFamily: h.font.hanken.regular,
    fontSize: 12,
    lineHeight: 16,
    color: h.outline,
    flexShrink: 0,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(190,202,190,0.45)",
    marginVertical: 4,
  },
});
