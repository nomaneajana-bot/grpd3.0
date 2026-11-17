import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
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
 * Discovery feed card — cover + host strip stay;
 * activity type sits on the cover (or in host meta when no photo),
 * never alone on its own row.
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
      : null;
  const pace = compactPace(
    session.targetPace,
    activityForSession(session) === "walk",
  );
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
  const cover = session.coverImageUrl?.trim() || null;

  const facts = [
    dist,
    pace ? (isWalk ? pace : `${pace}/km`) : null,
    durationBit?.value ?? null,
  ].filter(Boolean) as string[];

  const hasExtraChips = womenOnly || language || joined;
  const whenWithType = cover
    ? whereLine || "À venir"
    : [activity, whereLine || "À venir"].filter(Boolean).join(" · ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${ctaLabel} ${title}${time ? `, ${time}` : ""}${spot ? `, ${spot}` : ""}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      testID={`home-outing-row-${session.id}`}
    >
      {cover ? (
        <View style={styles.coverWrap} testID={`home-outing-cover-${session.id}`}>
          <Image
            source={{ uri: cover }}
            style={styles.cover}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <View
            style={[
              styles.coverChip,
              isWalk ? styles.coverChipWalk : styles.coverChipRun,
            ]}
            testID={`home-outing-labels-${session.id}`}
          >
            <Text
              style={[
                styles.coverChipText,
                isWalk ? styles.coverChipTextWalk : styles.coverChipTextRun,
              ]}
            >
              {activity}
            </Text>
          </View>
        </View>
      ) : null}

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
            {whenWithType}
          </Text>
        </View>
        {time ? (
          <View style={styles.timeBadge} testID={`home-outing-time-${session.id}`}>
            <Text style={styles.timeBadgeText}>{time}</Text>
          </View>
        ) : null}
      </View>

      {hasExtraChips ? (
        <View
          style={styles.labels}
          testID={cover ? undefined : `home-outing-labels-${session.id}`}
        >
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
      ) : null}

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {purpose ? (
          <Text style={styles.purpose} numberOfLines={2}>
            {purpose}
          </Text>
        ) : null}

        {facts.length > 0 ? (
          <Text
            style={styles.facts}
            numberOfLines={1}
            testID={`home-outing-metrics-${session.id}`}
          >
            {facts.join(" · ")}
          </Text>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text
          style={styles.presenceText}
          numberOfLines={1}
          testID={`home-outing-count-${session.id}`}
        >
          {count && count > 0
            ? `${count} inscrit${count === 1 ? "" : "s"}`
            : "Places ouvertes"}
        </Text>

        <View
          style={styles.ctaRow}
          testID={`home-outing-cta-${session.id}`}
        >
          <Text style={[styles.ctaText, joined && styles.ctaTextJoined]}>
            {ctaLabel}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={16}
            color={h.primary}
          />
        </View>
      </View>
    </Pressable>
  );
}

/** Pace that fits a meta line without trailing "/…" */
function compactPace(
  raw: string | undefined,
  walk: boolean,
): string {
  if (!raw || raw === "—" || /^0:00/i.test(raw)) {
    return walk ? "Libre" : "Libre";
  }
  let p = raw.replace(/^Allure\s+/i, "").trim();
  p = p.replace(/\s*\/\s*km$/i, "");
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
    overflow: "hidden",
  },
  cardPressed: {
    opacity: 0.96,
  },
  coverWrap: {
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 2,
    height: 148,
    backgroundColor: h.mutedSurface,
    overflow: "hidden",
  },
  cover: {
    width: "100%",
    height: "100%",
  },
  coverChip: {
    position: "absolute",
    left: 12,
    bottom: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  coverChipRun: {
    backgroundColor: "rgba(10, 22, 16, 0.72)",
  },
  coverChipWalk: {
    backgroundColor: "rgba(18, 22, 20, 0.68)",
  },
  coverChipText: {
    fontFamily: h.font.hanken.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  coverChipTextRun: {
    color: "#E8F5E9",
  },
  coverChipTextWalk: {
    color: "#ECEFEE",
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
  body: {
    gap: 4,
    paddingTop: 2,
  },
  title: {
    fontFamily: h.font.space.semibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: h.text,
  },
  purpose: {
    fontFamily: h.font.hanken.regular,
    fontSize: 14,
    lineHeight: 20,
    color: h.textSecondary,
  },
  facts: {
    fontFamily: h.font.hanken.medium,
    fontSize: 13,
    lineHeight: 18,
    color: h.outline,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(190,202,190,0.45)",
  },
  presenceText: {
    fontFamily: h.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: h.textSecondary,
    flexShrink: 1,
    minWidth: 0,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  ctaText: {
    fontFamily: h.font.hanken.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: h.primary,
  },
  ctaTextJoined: {
    color: h.primary,
  },
});
