import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { stitoTheme as t } from "@/constants/stitoTheme";

type Props = {
  dateLine: string;
  departureTime?: string | null;
  meetingTime?: string | null;
  placeTitle: string;
  placeDetail?: string | null;
  /** Members-only: exact GPS may be withheld — show honest copy, never a fake map. */
  isMembersOnly?: boolean;
  gpsAvailable?: boolean;
};

export function StitoLogisticsCard({
  dateLine,
  departureTime,
  meetingTime,
  placeTitle,
  placeDetail,
  isMembersOnly,
  gpsAvailable,
}: Props) {
  const timeBits = [
    departureTime ? `Départ à ${departureTime}` : null,
    meetingTime ? `Accueil dès ${meetingTime}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.card} testID="stito-logistics-card">
      <View style={styles.row}>
        <Ionicons name="time-outline" size={20} color={t.text} />
        <View style={styles.col}>
          <Text style={styles.title} testID="session-detail-date-label">
            {dateLine}
          </Text>
          {timeBits ? <Text style={styles.sub}>{timeBits}</Text> : null}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Ionicons name="location-outline" size={20} color={t.text} />
        <View style={styles.col}>
          <Text style={styles.title}>{placeTitle}</Text>
          {placeDetail ? <Text style={styles.sub}>{placeDetail}</Text> : null}
          {isMembersOnly && !gpsAvailable ? (
            <Text style={styles.privacyNote} testID="stito-location-privacy">
              Lieu exact réservé aux membres inscrits — pas de carte publique.
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.85)",
    padding: 20,
    gap: 14,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  col: { flex: 1, minWidth: 0, gap: 4 },
  title: {
    fontFamily: t.font.space.bold,
    fontSize: 15,
    color: t.text,
  },
  sub: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    color: t.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(232,232,233,0.9)",
  },
  privacyNote: {
    marginTop: 4,
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    color: t.textSecondary,
    fontStyle: "italic",
  },
});
