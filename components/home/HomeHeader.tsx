import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";

import { CitySlider } from "@/components/ui/CitySlider";
import { homeTheme as h } from "@/constants/homeTheme";

type HomeHeaderProps = {
  cityLabel: string;
  dayEyebrow: string;
  query: string;
  onQueryChange: (q: string) => void;
  onCityPress: () => void;
  onCitySelect?: (city: string) => void;
  searchFocused?: boolean;
  searchInputRef?: React.RefObject<TextInput | null>;
};

export function HomeHeader({
  cityLabel,
  dayEyebrow,
  query,
  onQueryChange,
  onCityPress,
  onCitySelect,
  searchInputRef,
}: HomeHeaderProps) {
  return (
    <View style={styles.wrap} testID="home-header">
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ville : ${cityLabel}. Activer la recherche`}
          onPress={onCityPress}
          style={({ pressed }) => [
            styles.cityChip,
            pressed && { opacity: 0.85 },
          ]}
          testID="home-city-chip"
        >
          <Ionicons name="location-outline" size={18} color={h.primary} />
          <Text style={styles.cityText} numberOfLines={1}>
            {cityLabel}
          </Text>
          <Ionicons name="chevron-down" size={16} color={h.textSecondary} />
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
          <Ionicons name="person" size={20} color={h.onPrimary} />
        </Pressable>
      </View>

      <Text style={styles.dayEyebrow} testID="home-day-eyebrow">
        {dayEyebrow}
      </Text>
      <Text
        style={styles.title}
        accessibilityRole="header"
        testID="home-title"
      >
        On sort ?
      </Text>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={h.textSecondary} />
        <TextInput
          ref={searchInputRef}
          accessibilityLabel="Rechercher une sortie ou une ville"
          testID="home-search"
          placeholder="Une ville, un lieu, une envie…"
          placeholderTextColor={h.textSecondary}
          value={query}
          onChangeText={onQueryChange}
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Effacer la recherche"
            onPress={() => onQueryChange("")}
            hitSlop={8}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={20} color={h.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <CitySlider
        value={cityLabel}
        onChange={(city) => {
          if (onCitySelect) onCitySelect(city);
          else onQueryChange(city);
        }}
        testID="home-city-slider"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: h.space.md },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: h.space.md,
  },
  cityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: h.touchMin,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: h.radiusChip,
    backgroundColor: h.mutedSurface,
    maxWidth: "78%",
  },
  cityText: {
    ...h.type.label,
    color: h.text,
    flexShrink: 1,
  },
  avatarBtn: {
    width: h.touchMin,
    height: h.touchMin,
    borderRadius: h.touchMin / 2,
    backgroundColor: h.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  dayEyebrow: {
    ...h.type.meta,
    color: h.textSecondary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: h.space.sm,
  },
  title: {
    ...h.type.pageTitle,
    color: h.text,
    letterSpacing: -0.6,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: h.touchMin,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: h.card,
    borderWidth: 1,
    borderColor: h.outline,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    ...h.type.bodySm,
    color: h.text,
    paddingVertical: 10,
  },
  clearBtn: {
    minWidth: h.touchMin,
    minHeight: h.touchMin,
    alignItems: "center",
    justifyContent: "center",
  },
});
