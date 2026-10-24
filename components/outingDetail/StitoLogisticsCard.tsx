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

/** When / where — open typography with Stitch hairlines. */
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
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: t.outline,
    marginBottom: 2,
  },
  value: {
    fontFamily: t.font.space.semibold,
    fontSize: 18,
    lineHeight: 24,
    color: t.text,
  },
  sub: {
    fontFamily: t.font.hanken.regular,
    fontSize: 15,
    lineHeight: 21,
    color: t.textSecondary,
    marginTop: 2,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(190,202,190,0.45)",
  },
  privacyNote: {
    marginTop: 6,
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.textSecondary,
  },
});
