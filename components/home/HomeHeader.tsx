import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";

import { DaySlider } from "@/components/home/DaySlider";
import { Avatar } from "@/components/ui/Avatar";
import { CitySlider } from "@/components/ui/CitySlider";
import { homeTheme as h } from "@/constants/homeTheme";
import {
  buildHomeDayOptions,
  formatHomeDayEyebrow,
  type HomeDayOption,
} from "@/lib/homeViewModel";

type HomeHeaderProps = {
  cityLabel: string;
  /** Selected discovery day YYYY-MM-DD */
  selectedDayISO: string;
  onDayChange: (iso: string) => void;
  dayOptions?: HomeDayOption[];
  query: string;
  onQueryChange: (q: string) => void;
  onCityPress: () => void;
  onCitySelect?: (city: string) => void;
  searchFocused?: boolean;
  searchInputRef?: React.RefObject<unknown>;
  /** Optional profile initial for the mark (Stitch: single letter). */
  profileInitial?: string;
  profileAvatarUrl?: string | null;
};

/**
 * Accueil top — city + date on one meta line (city first), then title.
 * No subtitle. No Bienvenue card.
 */
export function HomeHeader({
  cityLabel,
  selectedDayISO,
  onDayChange,
  dayOptions: dayOptionsProp,
  onCitySelect,
  onQueryChange,
  profileInitial = "Y",
  profileAvatarUrl = null,
}: HomeHeaderProps) {
  const [cityOpen, setCityOpen] = useState(false);
  const [dayOpen, setDayOpen] = useState(false);
  const dayOptions = useMemo(
    () => dayOptionsProp ?? buildHomeDayOptions(7),
    [dayOptionsProp],
  );
  const dayEyebrow =
    dayOptions.find((d) => d.iso === selectedDayISO)?.eyebrow ??
    formatHomeDayEyebrow(selectedDayISO);

  return (
    <View style={styles.wrap} testID="home-header">
      <View style={styles.metaBand} testID="home-header-location">
        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ville : ${cityLabel}. Changer de ville`}
              onPress={() => {
                setDayOpen(false);
                setCityOpen((v) => !v);
              }}
              style={({ pressed }) => [
                styles.cityBtn,
                pressed && { opacity: 0.85 },
              ]}
              testID="home-city-chip"
            >
              <Ionicons name="location" size={17} color={h.primary} />
              <Text style={styles.cityText} numberOfLines={1}>
                {cityLabel}
              </Text>
              <Ionicons
                name={cityOpen ? "chevron-up" : "chevron-down"}
                size={16}
                color={h.outline}
              />
            </Pressable>

            <Text style={styles.metaSep} accessible={false}>
              ·
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Jour : ${dayEyebrow}. Changer de jour`}
              accessibilityState={{ expanded: dayOpen }}
              onPress={() => {
                setCityOpen(false);
                setDayOpen((v) => !v);
              }}
              style={({ pressed }) => [
                styles.dayBtn,
                pressed && { opacity: 0.85 },
              ]}
              testID="home-day-eyebrow"
            >
              <Text style={styles.dayEyebrow} numberOfLines={1}>
                {dayEyebrow}
              </Text>
              <Ionicons
                name={dayOpen ? "chevron-up" : "chevron-down"}
                size={14}
                color={h.outline}
              />
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ouvrir le profil"
            onPress={() => router.push("/(tabs)/profile" as Href)}
            style={({ pressed }) => [
              styles.avatarBtn,
              pressed && { opacity: 0.85 },
            ]}
            testID="home-profile-btn"
          >
            <Avatar
              initial={profileInitial.slice(0, 1)}
              uri={profileAvatarUrl}
              size={36}
              backgroundColor={h.primary}
              testID="home-profile-avatar"
            />
          </Pressable>
        </View>

        {cityOpen ? (
          <CitySlider
            value={cityLabel}
            onChange={(city) => {
              if (onCitySelect) onCitySelect(city);
              else onQueryChange(city);
              setCityOpen(false);
            }}
            testID="home-city-slider"
          />
        ) : null}

        {dayOpen ? (
          <View testID="home-header-day">
            <DaySlider
              options={dayOptions}
              value={selectedDayISO}
              onChange={(iso) => {
                onDayChange(iso);
                setDayOpen(false);
              }}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.rule} />

      <View style={styles.titleBand} testID="home-header-title">
        <Text
          style={styles.title}
          accessibilityRole="header"
          testID="home-title"
        >
          On sort ?
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignSelf: "stretch",
    gap: 0,
  },
  metaBand: {
    width: "100%",
    alignSelf: "stretch",
    paddingVertical: 10,
    gap: 8,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
    backgroundColor: "rgba(190,202,190,0.55)",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
  },
  metaLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  cityBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 36,
    flexShrink: 1,
    maxWidth: "48%",
    paddingVertical: 2,
  },
  cityText: {
    fontFamily: h.font.space.semibold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.2,
    color: h.text,
    flexShrink: 1,
  },
  metaSep: {
    fontFamily: h.font.hanken.regular,
    fontSize: 13,
    lineHeight: 16,
    color: h.outline,
    flexShrink: 0,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  dayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
    minWidth: 0,
    paddingVertical: 2,
    minHeight: 36,
  },
  dayEyebrow: {
    fontFamily: h.font.hanken.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: h.outline,
    flexShrink: 1,
  },
  titleBand: {
    width: "100%",
    alignSelf: "stretch",
    paddingTop: 14,
    paddingBottom: 6,
  },
  title: {
    fontFamily: h.font.space.bold,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1,
    color: h.text,
    fontWeight: "700",
    width: "100%",
  },
});
