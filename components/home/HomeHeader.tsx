import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";

import { DaySlider } from "@/components/home/DaySlider";
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
};

/**
 * Stitch Accueil top — city + mark, selectable day, editorial greeting.
 */
export function HomeHeader({
  cityLabel,
  selectedDayISO,
  onDayChange,
  dayOptions: dayOptionsProp,
  onCitySelect,
  onQueryChange,
  profileInitial = "Y",
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
      <View style={styles.topRow}>
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
          <Ionicons name="location" size={19} color={h.primary} />
          <Text style={styles.cityText} numberOfLines={1}>
            {cityLabel}
          </Text>
          <Ionicons
            name={cityOpen ? "chevron-up" : "chevron-down"}
            size={18}
            color={h.outline}
          />
        </Pressable>

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
          <Text style={styles.avatarText}>{profileInitial.slice(0, 1)}</Text>
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

      <View style={styles.greeting}>
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
          <Text style={styles.dayEyebrow}>{dayEyebrow}</Text>
          <Ionicons
            name={dayOpen ? "chevron-up" : "chevron-down"}
            size={16}
            color={h.outline}
          />
        </Pressable>

        {dayOpen ? (
          <DaySlider
            options={dayOptions}
            value={selectedDayISO}
            onChange={(iso) => {
              onDayChange(iso);
              setDayOpen(false);
            }}
          />
        ) : null}

        <Text
          style={styles.title}
          accessibilityRole="header"
          testID="home-title"
        >
          On sort ?
        </Text>
        <Text style={styles.sub} testID="home-greeting-sub">
          Cette semaine, avec les tiens.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: h.space.sm },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 0,
    paddingBottom: 0,
  },
  cityBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    maxWidth: "78%",
    paddingVertical: 4,
  },
  cityText: {
    fontFamily: h.font.space.semibold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
    color: h.text,
    flexShrink: 1,
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: h.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: h.font.space.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: h.onPrimary,
  },
  greeting: {
    paddingTop: 0,
    paddingBottom: 0,
    gap: 4,
  },
  dayBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingVertical: 2,
    paddingRight: 4,
  },
  dayEyebrow: {
    fontFamily: h.font.hanken.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: h.outline,
  },
  title: {
    fontFamily: h.font.space.bold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.7,
    color: h.text,
    fontWeight: "700",
  },
  sub: {
    ...h.type.bodySm,
    color: h.textSecondary,
    marginTop: 0,
  },
});
