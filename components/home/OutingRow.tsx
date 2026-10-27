import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { homeTheme as h } from "@/constants/homeTheme";
import {
  activityLabel,
  discoveryDateParts,
  displayOutingTitle,
  formatTimeLabel,
} from "@/lib/homeViewModel";
import type { SessionData } from "@/lib/sessionData";
import { activityForSession } from "@/lib/experiences";

type OutingRowProps = {
  session: SessionData;
  onPress: () => void;
  /** Soft divider below (kept for list rhythm; not a card edge). */
  showRule?: boolean;
};

/**
 * Discovery row — date column + title hierarchy.
 * Interactive press target without card chrome.
 */
export function OutingRow({
  session,
  onPress,
  showRule = true,
}: OutingRowProps) {
  const host =
    session.coachName?.trim() || session.hostGroupName?.trim() || null;
  const spot = session.meetingPoint?.trim() || session.spot?.trim() || "";
  const place = [spot, host && spot !== host ? host : null]
    .filter(Boolean)
    .join(" · ");
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
        ? session.targetPace.replace(/^Allure\s+/i, "")
        : session.targetPace
      : null;
  const isWalk = activityForSession(session) === "walk";
  const activity = activityLabel(session);
  const date = discoveryDateParts(session);
  const title = displayOutingTitle(session.title);
  const stats = [pace, dist].filter(Boolean).join(" · ");

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Voir ${title}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          pressed && styles.rowPressed,
        ]}
        testID={`home-outing-row-${session.id}`}
      >
        <View
          style={[styles.dateCol, isWalk && styles.dateColWalk]}
          testID={`home-outing-date-${session.id}`}
        >
          {date ? (
            <>
              <Text style={styles.weekday}>{date.weekday}</Text>
              <Text style={styles.dayNum}>{date.dayNum}</Text>
              <Text style={styles.month}>{date.month}</Text>
            </>
          ) : (
            <Text style={styles.dayNumFallback}>·</Text>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.topMeta}>
            <Text
              style={[styles.activity, isWalk && styles.activityWalk]}
              numberOfLines={1}
            >
              {activity}
            </Text>
            {time ? <Text style={styles.time}>{time}</Text> : null}
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          {place ? (
            <Text style={styles.place} numberOfLines={1}>
              {place}
            </Text>
          ) : null}

          {stats ? (
            <Text style={styles.stats} numberOfLines={1}>
              {stats}
            </Text>
          ) : (
            <Text style={styles.stats} numberOfLines={1}>
              Allure libre
            </Text>
          )}
        </View>
      </Pressable>
      {showRule ? <View style={styles.rule} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 2,
    borderRadius: 14,
  },
  rowPressed: {
    backgroundColor: "rgba(216,227,216,0.28)",
  },
  dateCol: {
    width: 52,
    borderRadius: 14,
    backgroundColor: "rgba(0,95,52,0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 1,
  },
  dateColWalk: {
    backgroundColor: "rgba(63,73,65,0.08)",
  },
  weekday: {
    fontFamily: h.font.hanken.semibold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: h.primary,
  },
  dayNum: {
    fontFamily: h.font.space.bold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.4,
    color: h.text,
  },
  month: {
    fontFamily: h.font.hanken.medium,
    fontSize: 11,
    lineHeight: 14,
    color: h.textSecondary,
  },
  dayNumFallback: {
    fontFamily: h.font.space.bold,
    fontSize: 18,
    color: h.outline,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 3,
    paddingTop: 2,
  },
  topMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 2,
  },
  activity: {
    fontFamily: h.font.hanken.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.3,
    color: h.primary,
  },
  activityWalk: {
    color: h.textSecondary,
  },
  time: {
    fontFamily: h.font.hanken.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: h.text,
    fontVariant: ["tabular-nums"],
  },
  title: {
    fontFamily: h.font.space.semibold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.25,
    color: h.text,
  },
  place: {
    fontFamily: h.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: h.textSecondary,
    marginTop: 1,
  },
  stats: {
    fontFamily: h.font.hanken.medium,
    fontSize: 12,
    lineHeight: 16,
    color: h.outline,
    marginTop: 2,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(190,202,190,0.35)",
    marginLeft: 66,
  },
});
