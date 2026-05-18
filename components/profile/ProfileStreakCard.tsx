import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { profileTheme } from "@/constants/profileTheme";
import { colors, typography } from "@/constants/ui";

const DAY_LABELS = ["L", "M", "Me", "J", "V", "S", "D"] as const;

type ProfileStreakCardProps = {
  sessionCount: number;
  kmYtd: number;
  weekActivity: boolean[];
};

export function ProfileStreakCard({
  sessionCount,
  kmYtd,
  weekActivity,
}: ProfileStreakCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>SÉRIE EN COURS</Text>
        <View style={styles.flameWrap}>
          <Ionicons name="flame" size={16} color={profileTheme.streakKicker} />
        </View>
      </View>
      <Text style={styles.heroLine}>
        <Text style={styles.heroNumber}>{sessionCount}</Text>
        <Text style={styles.heroRest}>
          {" "}
          séances · {kmYtd} km depuis janvier
        </Text>
      </Text>
      <View style={styles.weekRow}>
        {DAY_LABELS.map((label, i) => {
          const active = weekActivity[i] ?? false;
          return (
            <View key={label} style={styles.dayCol}>
              <View
                style={[
                  styles.dayBox,
                  active && styles.dayBoxActive,
                ]}
              >
                {active ? <View style={styles.dayDot} /> : null}
              </View>
              <Text style={styles.dayLabel}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: profileTheme.cardBackground,
    borderRadius: profileTheme.cardRadius,
    borderWidth: 1,
    borderColor: profileTheme.streakBorder,
    padding: 16,
    marginBottom: profileTheme.cardGap,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  kicker: {
    fontSize: typography.sizes.xs,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: profileTheme.streakKicker,
  },
  flameWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.accent.orangeDim,
    alignItems: "center",
    justifyContent: "center",
  },
  heroLine: {
    marginBottom: 16,
  },
  heroNumber: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  heroRest: {
    fontSize: typography.sizes.base,
    fontWeight: "400",
    color: colors.text.secondary,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  dayCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  dayBox: {
    width: "100%",
    maxWidth: 36,
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: colors.surface.s3,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBoxActive: {
    backgroundColor: "#3A2010",
    borderWidth: 1,
    borderColor: profileTheme.streakBorder,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: profileTheme.streakKicker,
  },
  dayLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: "500",
  },
});
