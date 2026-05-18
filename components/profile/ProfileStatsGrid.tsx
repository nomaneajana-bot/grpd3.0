import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { profileTheme } from "@/constants/profileTheme";
import { colors, hairline, typography } from "@/constants/ui";

type StatCellProps = {
  label: string;
  value: string;
  footer?: string;
  sub?: string;
  valueColor?: string;
};

function StatCell({ label, value, footer, sub, valueColor }: StatCellProps) {
  return (
    <View style={styles.cell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueColor && { color: valueColor }]}>
        {value}
      </Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

type ProfileStatsGridProps = {
  sessions: number;
  kmYtd: number;
  pr10k: string;
  pr10kPace?: string | null;
  avgPace: string;
};

export function ProfileStatsGrid({
  sessions,
  kmYtd,
  pr10k,
  pr10kPace,
  avgPace,
}: ProfileStatsGridProps) {
  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <StatCell
          label="SÉANCES"
          value={String(sessions)}
          footer="année"
        />
        <StatCell label="KM" value={String(kmYtd)} footer="cette année" />
      </View>
      <View style={styles.row}>
        <StatCell
          label="PR 10 KM"
          value={pr10k}
          sub={pr10kPace ?? undefined}
          valueColor={profileTheme.statGreen}
        />
        <StatCell
          label="ALLURE MOY."
          value={avgPace}
          sub="/km · dernières 4 séances"
          valueColor={profileTheme.statBlue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 7,
    marginBottom: profileTheme.sectionGap,
  },
  row: {
    flexDirection: "row",
    gap: 7,
  },
  cell: {
    flex: 1,
    backgroundColor: profileTheme.cardBackground,
    borderRadius: profileTheme.cardRadius,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: hairline,
    borderColor: colors.border.default,
  },
  label: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },
  sub: {
    marginTop: 2,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  footer: {
    marginTop: 4,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
});
