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
  isMembersOnly?: boolean;
  gpsAvailable?: boolean;
};

/** When / where — soft logistics plane, no broadsheet hairlines. */
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
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="calendar-outline" size={18} color={t.primary} />
        </View>
        <View style={styles.block}>
          <Text style={styles.label}>Quand</Text>
          <Text style={styles.value} testID="session-detail-date-label">
            {dateLine}
          </Text>
          {timeBits ? <Text style={styles.sub}>{timeBits}</Text> : null}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="location-outline" size={18} color={t.primary} />
        </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
    paddingVertical: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  block: { flex: 1, minWidth: 0, gap: 2 },
  label: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.35,
    textTransform: "uppercase",
    color: t.outline,
  },
  value: {
    fontFamily: t.font.space.semibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.25,
    color: t.text,
  },
  sub: {
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.textSecondary,
    marginTop: 1,
  },
  privacyNote: {
    marginTop: 4,
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.textSecondary,
  },
});
