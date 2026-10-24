import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

type Props = {
  dateLine: string;
  departureTime?: string | null;
  meetingTime?: string | null;
  placeTitle: string;
  placeDetail?: string | null;
  isMembersOnly?: boolean;
  gpsAvailable?: boolean;
};

/** When / where — open rows, not a dense boxed stack. */
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
    departureTime ? `Départ ${departureTime}` : null,
    meetingTime ? `Accueil ${meetingTime}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.wrap} testID="stito-logistics-card">
      <View style={styles.block}>
        <Text style={styles.label}>Quand</Text>
        <Text style={styles.value} testID="session-detail-date-label">
          {dateLine}
        </Text>
        {timeBits ? <Text style={styles.sub}>{timeBits}</Text> : null}
      </View>
      <View style={styles.rule} />
      <View style={styles.block}>
        <Text style={styles.label}>Où</Text>
        <Text style={styles.value}>{placeTitle}</Text>
        {placeDetail ? <Text style={styles.sub}>{placeDetail}</Text> : null}
        {isMembersOnly && !gpsAvailable ? (
          <Text style={styles.privacyNote} testID="stito-location-privacy">
            Lieu exact réservé aux membres inscrits.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 4,
    gap: 18,
  },
  block: { gap: 4 },
  label: {
    fontFamily: t.font.space.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: t.outline,
    marginBottom: 2,
  },
  value: {
    fontFamily: t.font.space.bold,
    fontSize: 17,
    lineHeight: 22,
    color: t.text,
  },
  sub: {
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.textSecondary,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.surfaceContainerHigh,
  },
  privacyNote: {
    marginTop: 6,
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.textSecondary,
  },
});
