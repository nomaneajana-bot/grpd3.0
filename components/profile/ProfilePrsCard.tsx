import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";
import { formatPaceColon } from "@/lib/profileMetrics";
import type { TestRecord } from "@/lib/profileStore";

type ProfilePrsCardProps = {
  records: TestRecord[];
};

function formatTestDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    // YYYY-MM-DD → local calendar day without UTC shift surprises
    const parts = iso.split("-").map(Number);
    if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function formatDistance(meters?: number | null): string | null {
  if (meters == null || meters <= 0) return null;
  if (meters >= 1000) {
    const km = meters / 1000;
    return Number.isInteger(km) ? `${km} km` : `${km.toFixed(1).replace(".", ",")} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Profile “historique” — real PRs with dates, not a hollow past-outings teaser.
 */
export function ProfilePrsCard({ records }: ProfilePrsCardProps) {
  if (records.length === 0) {
    return (
      <View style={styles.card} testID="profile-past-sessions">
        <Text style={styles.emptyTitle}>Aucun record pour l’instant</Text>
        <Text style={styles.emptyBody}>
          Tes meilleurs chronos apparaîtront ici dès que tu en enregistres.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card} testID="profile-past-sessions">
      {records.map((record, index) => {
        const distance = formatDistance(record.distanceMeters);
        const dateLabel = formatTestDate(record.testDate);
        const sub = [distance, dateLabel].filter(Boolean).join(" · ");
        return (
          <View key={record.id}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <View style={styles.row} testID={`profile-pr-${record.id}`}>
              <View style={styles.meta}>
                <Text style={styles.label} numberOfLines={1}>
                  {record.label}
                </Text>
                {sub ? (
                  <Text style={styles.sub} numberOfLines={1}>
                    {sub}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.pace}>
                {formatPaceColon(record.paceSecondsPerKm)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: t.card,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(232,232,233,0.9)",
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: t.text,
    paddingTop: 12,
  },
  emptyBody: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.textSecondary,
    paddingBottom: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 12,
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    fontFamily: t.font.space.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: t.text,
  },
  sub: {
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.textSecondary,
  },
  pace: {
    fontFamily: t.font.space.bold,
    fontSize: 16,
    lineHeight: 20,
    color: t.primary,
    fontVariant: ["tabular-nums"],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.outlineVariant,
  },
});
