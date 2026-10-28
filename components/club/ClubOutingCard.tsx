import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { stitoTheme as t } from "@/constants/stitoTheme";
import { activityForSession, isUpcoming } from "@/lib/experiences";
import {
  activityLabel,
  discoveryDateParts,
  displayOutingTitle,
  formatTimeLabel,
  initialsFromName,
} from "@/lib/homeViewModel";
import {
  clubOrHostLabel,
  distanceLabel,
  formatOutingDateCompact,
  locationLabel,
  paceLabel,
} from "@/lib/mesSortiesViewModel";
import type { SessionData } from "@/lib/sessionData";

type AttendanceKind = "joined" | "left" | "none";

type ClubOutingCardProps = {
  session: SessionData;
  attendance: AttendanceKind;
  onPress: () => void;
};

const HOST_TONES = [t.primary, "#167A47", "#333E35", "#3F4941", "#005F34"] as const;

function hostTone(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % 97;
  return HOST_TONES[h % HOST_TONES.length]!;
}

function compactPace(raw: string | null | undefined, walk: boolean): string {
  if (!raw || raw === "—" || /^0:00/i.test(raw)) return walk ? "Libre" : "Libre";
  return (
    raw
      .replace(/^Allure\s+/i, "")
      .replace(/\s*\/\s*km$/i, "")
      .replace(/\/km\b/gi, "")
      .trim() || "Libre"
  );
}

function volumeBit(
  volume: string | undefined,
): { kind: "duration" | "format"; value: string } | null {
  const v = (volume ?? "").trim();
  if (!v) return null;
  const min = v.match(/(\d+)\s*min/i);
  if (min) return { kind: "duration", value: `${min[1]} min` };
  const hour = v.match(/(\d+)\s*h(?:\s*(\d+))?/i);
  if (hour) {
    return {
      kind: "duration",
      value: hour[2] ? `${hour[1]}h${hour[2]}` : `${hour[1]} h`,
    };
  }
  // "14 km · endurance" → format from the non-km segment
  const parts = v.split("·").map((p) => p.trim()).filter(Boolean);
  const format = parts.find((p) => !/\bkm\b/i.test(p) && p.length <= 18);
  if (format) return { kind: "format", value: format };
  return null;
}

/**
 * Club hub outing row — same scan language as Mes Sorties:
 * date rail, host, type/visibility chips, metrics, attendance CTA.
 */
export function ClubOutingCard({
  session,
  attendance,
  onPress,
}: ClubOutingCardProps) {
  const host = clubOrHostLabel(session);
  const isWalk = activityForSession(session) === "walk";
  const activity = activityLabel(session);
  const title = displayOutingTitle(session.title);
  const date = discoveryDateParts(session);
  const time = formatTimeLabel(session.timeMinutes);
  const dist = distanceLabel(session);
  const pace = compactPace(paceLabel(session), isWalk);
  const dur = volumeBit(session.volume);
  const loc = locationLabel(session);
  const initials = initialsFromName(host) || (isWalk ? "M" : "C");
  const tone = hostTone(host);
  const typeTag = (session.typeLabel || "SORTIE").trim().toUpperCase();
  const visibilityTag =
    session.visibility === "members" ? "Membres" : "Public";
  const upcoming = isUpcoming(session);
  const evening = (session.timeMinutes ?? 0) >= 16 * 60;

  const attendanceCopy =
    attendance === "joined"
      ? "Tu es inscrit à cette sortie."
      : attendance === "left"
        ? "Tu as annulé ta participation."
        : "Tu n’es pas inscrit à cette sortie.";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Voir la sortie ${title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isWalk && styles.cardWalk,
        evening && !isWalk && styles.cardEvening,
        !upcoming && styles.cardPast,
        pressed && { opacity: 0.94 },
      ]}
      testID={`club-outing-${session.id}`}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.dateRail,
            !upcoming && styles.dateRailPast,
            evening && upcoming && styles.dateRailEvening,
          ]}
        >
          <Text style={styles.dateWeekday}>{date?.weekday ?? "—"}</Text>
          <Text style={[styles.dateDay, !upcoming && styles.dateDayPast]}>
            {date?.dayNum ?? "·"}
          </Text>
          <Text style={styles.dateMonth}>{date?.month ?? ""}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.hostRow}>
            <View style={[styles.avatar, { backgroundColor: tone }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.hostCol}>
              <Text style={styles.hostName} numberOfLines={1}>
                {host}
              </Text>
              <View style={styles.chips}>
                <View style={[styles.chip, isWalk ? styles.chipWalk : styles.chipRun]}>
                  <Text
                    style={[
                      styles.chipText,
                      isWalk ? styles.chipTextWalk : styles.chipTextRun,
                    ]}
                  >
                    {activity}
                  </Text>
                </View>
                <View style={styles.chipType}>
                  <Text style={styles.chipTypeText}>{typeTag}</Text>
                </View>
                <View
                  style={[
                    styles.chipVis,
                    session.visibility === "members"
                      ? styles.chipVisMembers
                      : styles.chipVisPublic,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipVisText,
                      session.visibility === "members"
                        ? styles.chipVisTextMembers
                        : styles.chipVisTextPublic,
                    ]}
                  >
                    {visibilityTag}
                  </Text>
                </View>
                {attendance === "joined" ? (
                  <View style={styles.chipJoined}>
                    <Ionicons
                      name="checkmark-circle"
                      size={12}
                      color={t.onSecondaryContainer}
                    />
                    <Text style={styles.chipJoinedText}>Inscrit</Text>
                  </View>
                ) : null}
              </View>
            </View>
            {time ? (
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>{time}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.spot} numberOfLines={1}>
            {[formatOutingDateCompact(session), loc].filter(Boolean).join(" · ") ||
              "Lieu à préciser"}
          </Text>

          <View style={styles.metrics}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Distance</Text>
              <Text style={styles.metricStrong} numberOfLines={1}>
                {dist ?? "—"}
              </Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>{isWalk ? "Rythme" : "Allure"}</Text>
              <Text
                style={[styles.metricValue, pace.length > 10 && styles.metricTight]}
                numberOfLines={1}
              >
                {pace}
              </Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Durée</Text>
              <Text style={styles.metricValue} numberOfLines={1}>
                {dur ?? "—"}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text
              style={styles.attendance}
              testID={`club-outing-attendance-${session.id}`}
              numberOfLines={2}
            >
              {attendanceCopy}
            </Text>
            <Text style={styles.cta}>Voir la sortie →</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    borderLeftWidth: 3,
    borderLeftColor: t.secondaryFixedDim,
    padding: 14,
    shadowColor: "#1A1C1D",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardWalk: { borderLeftColor: "#576158" },
  cardEvening: { borderLeftColor: t.primary },
  cardPast: { borderLeftColor: t.outlineVariant },
  row: { flexDirection: "row", alignItems: "stretch", gap: 12 },
  dateRail: {
    width: 52,
    borderRadius: 14,
    backgroundColor: "rgba(0,95,52,0.1)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 2,
  },
  dateRailPast: { backgroundColor: "rgba(0,95,52,0.08)" },
  dateRailEvening: { backgroundColor: "rgba(51,62,53,0.12)" },
  dateWeekday: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 11,
    lineHeight: 14,
    color: t.primary,
    textTransform: "uppercase",
  },
  dateDay: {
    fontFamily: t.font.space.bold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.6,
    color: t.primary,
    fontVariant: ["tabular-nums"],
  },
  dateDayPast: { color: t.text },
  dateMonth: {
    fontFamily: t.font.hanken.medium,
    fontSize: 11,
    lineHeight: 14,
    color: t.outline,
  },
  body: { flex: 1, minWidth: 0, gap: 8 },
  hostRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 12,
    color: t.onPrimary,
  },
  hostCol: { flex: 1, minWidth: 0, gap: 4 },
  hostName: {
    fontFamily: t.font.space.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: t.text,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipRun: { backgroundColor: "rgba(0,95,52,0.1)" },
  chipWalk: { backgroundColor: "rgba(63,73,65,0.12)" },
  chipText: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 11,
    lineHeight: 14,
  },
  chipTextRun: { color: t.primary },
  chipTextWalk: { color: t.textSecondary },
  chipType: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(0,95,52,0.08)",
  },
  chipTypeText: {
    fontFamily: t.font.space.bold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.4,
    color: t.primary,
  },
  chipVis: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipVisMembers: { backgroundColor: "rgba(51,62,53,0.1)" },
  chipVisPublic: { backgroundColor: "rgba(0,95,52,0.08)" },
  chipVisText: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 11,
    lineHeight: 14,
  },
  chipVisTextMembers: { color: t.textSecondary },
  chipVisTextPublic: { color: t.primary },
  chipJoined: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(118,252,167,0.45)",
  },
  chipJoinedText: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 11,
    lineHeight: 14,
    color: t.onSecondaryContainer,
  },
  timeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(0,95,52,0.1)",
    minWidth: 52,
    alignItems: "center",
  },
  timeBadgeText: {
    fontFamily: t.font.space.bold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.2,
    color: t.primary,
    fontVariant: ["tabular-nums"],
  },
  title: {
    fontFamily: t.font.space.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: t.text,
  },
  spot: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.textSecondary,
    marginTop: -2,
  },
  metrics: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: t.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricCol: { flex: 1, minWidth: 0, gap: 2 },
  metricLabel: {
    fontFamily: t.font.hanken.medium,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: t.outline,
  },
  metricValue: {
    fontFamily: t.font.space.semibold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.2,
    color: t.text,
  },
  metricTight: { fontSize: 12, lineHeight: 16 },
  metricStrong: {
    fontFamily: t.font.space.bold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.3,
    color: t.primary,
  },
  footer: {
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(232,232,233,0.9)",
    paddingTop: 10,
  },
  attendance: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.textSecondary,
  },
  cta: {
    fontFamily: t.font.space.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: t.primary,
  },
});
