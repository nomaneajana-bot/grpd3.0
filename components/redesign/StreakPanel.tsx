import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { colors, borderRadius, typography } from "@/constants/ui";

type StreakDay = "on" | "off" | "today" | "rest";

type StreakPanelProps = {
  streakCount: number;
  caption?: string;
  footer?: string;
  week?: StreakDay[];
};

/** Matches home mock: L,M,J,V done; Me,S muted; D = today (blue). */
const defaultWeek: StreakDay[] = [
  "on",
  "on",
  "off",
  "on",
  "on",
  "off",
  "today",
];

export function StreakPanel({
  streakCount,
  caption = "Tu cours depuis plusieurs séances sans t'arrêter.",
  footer,
  week = defaultWeek,
}: StreakPanelProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.kicker}>Série en cours</Text>
          <Text style={styles.hero}>
            {streakCount}{" "}
            <Text style={styles.heroUnit}>séances</Text>
          </Text>
          <Text style={styles.caption}>{caption}</Text>
        </View>
        <View style={styles.flameBox}>
          <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
            <Path
              d="M11 3 C11 3 7 7 7 11 C7 13.8 8.8 16 11 16 C13.2 16 15 13.8 15 11 C15 9 14 7 13 6"
              stroke={colors.accent.orange}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
            <Path
              d="M11 16 L11 19"
              stroke={colors.accent.orange}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
            <Circle cx={11} cy={19} r={1} fill={colors.accent.orange} />
          </Svg>
        </View>
      </View>
      <View style={styles.dots}>
        {week.map((d, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              d === "on" && styles.dotOn,
              d === "today" && styles.dotToday,
              d === "rest" && styles.dotRest,
              d === "off" && styles.dotOff,
            ]}
          >
            <Text
              style={[
                styles.dotLbl,
                (d === "on" || d === "today") && styles.dotLblOn,
              ]}
            >
              {["L", "M", "Me", "J", "V", "S", "D"][i] ?? ""}
            </Text>
          </View>
        ))}
      </View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.accent.orangeDim,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#3A2010",
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 9,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  copy: { flex: 1, paddingRight: 8 },
  kicker: {
    fontSize: typography.sizes.sm,
    color: colors.accent.orange,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  hero: {
    fontSize: typography.sizes.hero,
    fontWeight: "800",
    color: colors.text.primary,
    letterSpacing: -1.5,
    lineHeight: 40,
  },
  heroUnit: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.secondary,
    letterSpacing: 0,
  },
  caption: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    marginTop: 3,
  },
  flameBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2A1608",
    borderWidth: 1,
    borderColor: "#4A2810",
    alignItems: "center",
    justifyContent: "center",
  },
  dots: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dotOn: { backgroundColor: colors.accent.orange },
  dotToday: { backgroundColor: colors.accent.primary },
  dotRest: { backgroundColor: colors.surface.s2 },
  dotOff: { backgroundColor: colors.surface.s3 },
  dotLbl: { fontSize: 9, fontWeight: "600", color: colors.text.tertiary },
  dotLblOn: { color: "#fff" },
  footer: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 8,
  },
});
