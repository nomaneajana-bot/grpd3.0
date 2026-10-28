import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { homeTheme as h } from "@/constants/homeTheme";
import {
  activityLabel,
  confirmedParticipantCount,
  discoveryDateParts,
  displayOutingTitle,
  formatTimeLabel,
  initialsFromName,
} from "@/lib/homeViewModel";
import type { SessionData } from "@/lib/sessionData";
import { activityForSession } from "@/lib/experiences";

type OutingRowProps = {
  session: SessionData;
  onPress: () => void;
  /** @deprecated Cards are spaced; hairline unused. */
  showRule?: boolean;
};

const AVATAR_TONES = [h.primary, "#333E35", "#576158"] as const;

/**
 * Discovery feed card — tiny UX polish:
 * scan time first, full pace (no /… truncation), labels that matter, clear Rejoindre.
 */
export function OutingRow({ session, onPress }: OutingRowProps) {
  const host =
    session.coachName?.trim() || session.hostGroupName?.trim() || null;
  const spot = session.meetingPoint?.trim() || session.spot?.trim() || "";
  const time = formatTimeLabel(session.timeMinutes);
  const date = discoveryDateParts(session);
  const dayBit = date
    ? `${date.weekday}. ${date.dayNum} ${date.month}`
    : null;
  const whereLine = [dayBit, spot].filter(Boolean).join(" · ");
  const dist =
    session.estimatedDistanceKm > 0
      ? `${String(session.estimatedDistanceKm).replace(".", ",")} km`
      : "—";
  const pace = compactPace(session.targetPace, activityForSession(session) === "walk");
  const durationBit = shortDuration(session.volume);
  const isWalk = activityForSession(session) === "walk";
  const activity = activityLabel(session);
  const title = displayOutingTitle(session.title);
  const purpose = (session.coachAdvice ?? "").trim();
  const womenOnly = session.genderRestriction === "women_only";
  const language =
    /langue|langues|french|talk/i.test(session.typeLabel) ||
    /langue|french|talk/i.test(session.title);
  const joined = session.attendanceStatus === "joined";
  const count = confirmedParticipantCount(session);
  const hostInitials = initialsFromName(host) || (isWalk ? "M" : "C");
  const ctaLabel = joined ? "Voir" : "Rejoindre";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${ctaLabel} ${title}${time ? `, ${time}` : ""}${spot ? `, ${spot}` : ""}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      testID={`home-outing-row-${session.id}`}
    >
      <View style={styles.hostRow}>
        <View
          style={[styles.hostAvatar, { backgroundColor: AVATAR_TONES[0] }]}
          testID={`home-outing-host-${session.id}`}
        >
          <Text style={styles.hostAvatarText}>{hostInitials}</Text>
        </View>
        <View style={styles.hostText}>
          <Text style={styles.hostName} numberOfLines={1}>
            {host || "Organisateur"}
          </Text>
          <Text style={styles.when} numberOfLines={1}>
            {whereLine || "À venir"}
          </Text>
        </View>
        {time ? (
          <View style={styles.timeBadge} testID={`home-outing-time-${session.id}`}>
            <Text style={styles.timeBadgeText}>{time}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.labels} testID={`home-outing-labels-${session.id}`}>
        <View style={[styles.chip, isWalk ? styles.chipWalk : styles.chipRun]}>
          <Text
            style={[styles.chipText, isWalk ? styles.chipTextWalk : styles.chipTextRun]}
          >
            {activity}
          </Text>
        </View>
        {womenOnly ? (
          <View style={styles.chipWomen} testID={`home-outing-women-${session.id}`}>
            <Text style={styles.chipWomenText}>Entre femmes</Text>
          </View>
        ) : null}
        {language ? (
          <View style={styles.chipLang}>
            <Text style={styles.chipLangText}>Langue</Text>
          </View>
        ) : null}
        {joined ? (
          <View style={styles.chipJoined}>
            <Text style={styles.chipJoinedText}>Inscrit</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      {purpose ? (
        <Text style={styles.purpose} numberOfLines={2}>
          {purpose}
        </Text>
      ) : null}

      <View style={styles.metrics} testID={`home-outing-metrics-${session.id}`}>
        <Metric label="Distance" value={dist} />
        <Metric label={isWalk ? "Rythme" : "Allure"} value={pace} />
        <Metric
          label={durationBit?.kind === "format" ? "Format" : "Durée"}
          value={durationBit?.value || "—"}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.presence}>
          {count && count > 0 ? (
            <>
              <View style={styles.avatars}>
                <View
                  style={[styles.miniAvatar, { backgroundColor: AVATAR_TONES[0] }]}
                >
                  <Text style={styles.miniAvatarText}>{hostInitials}</Text>
                </View>
                {count > 1 ? (
                  <View
                    style={[
                      styles.miniAvatar,
                      styles.miniAvatarMore,
                      { marginLeft: -8 },
                    ]}
                  >
                    <Text style={styles.miniAvatarMoreText}>
                      +{Math.min(count - 1, 99)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={styles.countText}
                testID={`home-outing-count-${session.id}`}
              >
                {count} inscrit{count === 1 ? "" : "s"}
              </Text>
            </>
          ) : (
            <Text style={styles.countTextMuted}>Places ouvertes</Text>
          )}
        </View>

        <View
          style={[styles.cta, joined && styles.ctaJoined]}
          testID={`home-outing-cta-${session.id}`}
        >
          <Ionicons
            name={joined ? "arrow-forward" : "add"}
            size={16}
            color={joined ? h.primary : h.onPrimary}
          />
          <Text style={[styles.ctaText, joined && styles.ctaTextJoined]}>
            {ctaLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const tight = value.length > 10;
  return (
    <View style={styles.metricCol}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text
        style={[styles.metricValue, tight && styles.metricValueTight]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {value}
      </Text>
    </View>
  );
}

/** Pace that fits a 3-col metric without trailing "/…" */
function compactPace(
  raw: string | undefined,
  walk: boolean,
): string {
  if (!raw || raw === "—" || /^0:00/i.test(raw)) {
    return walk ? "Libre" : "Libre";
  }
  let p = raw.replace(/^Allure\s+/i, "").trim();
  p = p.replace(/\s*\/\s*km$/i, "");
  // "5:10–5:40/km" → "5:10–5:40"
  p = p.replace(/\/km\b/gi, "");
  return p || "Libre";
}

function shortDuration(
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
  const first = v.split("·")[0]?.trim() ?? "";
  if (first && first.length <= 18) return { kind: "format", value: first };
  return null;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: h.card,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: "#1A1C1D",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.96,
  },
  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  hostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  hostAvatarText: {
    fontFamily: h.font.hanken.semibold,
    fontSize: 13,
    color: h.onPrimary,
  },
  hostText: { flex: 1, minWidth: 0, gap: 2 },
  hostName: {
    fontFamily: h.font.space.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: h.text,
  },
  when: {
    fontFamily: h.font.hanken.regular,
    fontSize: 12,
    lineHeight: 16,
    color: h.textSecondary,
  },
  timeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(0,95,52,0.1)",
    minWidth: 54,
    alignItems: "center",
  },
  timeBadgeText: {
    fontFamily: h.font.space.bold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.2,
    color: h.primary,
    fontVariant: ["tabular-nums"],
  },
  labels: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipRun: {
    backgroundColor: "rgba(0,95,52,0.1)",
  },
  chipWalk: {
    backgroundColor: "rgba(63,73,65,0.1)",
  },
  chipText: {
    fontFamily: h.font.hanken.semibold,
    fontSize: 11,
    lineHeight: 14,
  },
  chipTextRun: { color: h.primary },
  chipTextWalk: { color: h.textSecondary },
  chipWomen: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#FCE4EC",
  },
  chipWomenText: {
    fontFamily: h.font.hanken.semibold,
    fontSize: 11,
    lineHeight: 14,
    color: "#AD1457",
  },
  chipLang: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#E3F2FD",
  },
  chipLangText: {
    fontFamily: h.font.hanken.semibold,
    fontSize: 11,
    lineHeight: 14,
    color: "#1565C0",
  },
  chipJoined: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(118,252,167,0.35)",
  },
  chipJoinedText: {
    fontFamily: h.font.hanken.semibold,
    fontSize: 11,
    lineHeight: 14,
    color: h.onSecondaryContainer,
  },
  title: {
    fontFamily: h.font.space.semibold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: h.text,
  },
  purpose: {
    fontFamily: h.font.hanken.regular,
    fontSize: 14,
    lineHeight: 20,
    color: h.textSecondary,
    marginTop: -2,
  },
  metrics: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: h.mutedSurface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  metricLabel: {
    fontFamily: h.font.hanken.medium,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: h.outline,
  },
  metricValue: {
    fontFamily: h.font.space.semibold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
    color: h.text,
  },
  metricValueTight: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 2,
  },
  presence: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  avatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: h.card,
  },
  miniAvatarText: {
    fontFamily: h.font.hanken.semibold,
    fontSize: 9,
    color: h.onPrimary,
  },
  miniAvatarMore: {
    backgroundColor: h.surfaceContainer,
  },
  miniAvatarMoreText: {
    fontFamily: h.font.hanken.semibold,
    fontSize: 9,
    color: h.text,
  },
  countText: {
    fontFamily: h.font.hanken.medium,
    fontSize: 13,
    lineHeight: 18,
    color: h.textSecondary,
    flexShrink: 1,
  },
  countTextMuted: {
    fontFamily: h.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: h.outline,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: h.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 40,
  },
  ctaJoined: {
    backgroundColor: "rgba(0,95,52,0.1)",
  },
  ctaText: {
    fontFamily: h.font.hanken.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: h.onPrimary,
  },
  ctaTextJoined: {
    color: h.primary,
  },
});
