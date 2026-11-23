import React, { useEffect, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";

import { homeTheme as h } from "@/constants/homeTheme";
import type { HomeDayOption } from "@/lib/homeViewModel";

type Props = {
  options: HomeDayOption[];
  value: string;
  onChange: (iso: string) => void;
  testID?: string;
};

/** Horizontal day chips for Accueil — pick which day discovery shows. */
export function DaySlider({
  options,
  value,
  onChange,
  testID = "home-day-slider",
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = options.findIndex((o) => o.iso === value);

  useEffect(() => {
    if (selectedIndex < 0 || !scrollRef.current) return;
    scrollRef.current.scrollTo({
      x: Math.max(0, selectedIndex * 88 - 24),
      animated: true,
    });
  }, [selectedIndex]);

  return (
    <View
      style={styles.wrap}
      testID={testID}
      accessibilityRole="list"
      accessibilityLabel="Jour"
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        {options.map((option, index) => {
          const selected = option.iso === value;
          return (
            <Animated.View
              key={option.iso}
              entering={FadeInRight.delay(40 + index * 45)
                .duration(280)
                .springify()
                .damping(18)}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={option.eyebrow}
                onPress={() => onChange(option.iso)}
                style={({ pressed }) => [
                  styles.chip,
                  selected && styles.chipOn,
                  pressed && { opacity: 0.88 },
                ]}
                testID={`home-day-chip-${option.iso}`}
              >
                <Text style={[styles.chipText, selected && styles.chipTextOn]}>
                  {option.chip}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 2 },
  row: { gap: 8, paddingVertical: 2, paddingRight: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: h.mutedSurface,
    borderWidth: 1,
    borderColor: "rgba(190,202,190,0.45)",
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  chipOn: {
    backgroundColor: h.primary,
    borderColor: h.primary,
  },
  chipText: {
    fontFamily: h.font.space.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: h.text,
  },
  chipTextOn: {
    color: h.onPrimary,
  },
});
