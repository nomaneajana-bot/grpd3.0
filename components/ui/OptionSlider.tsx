import React, { useEffect, useRef } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

export type OptionSliderProps = {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  testID?: string;
  /** Accessibility name for the group, e.g. "Ville" */
  label?: string;
  style?: StyleProp<ViewStyle>;
  /** When true, allow free-typed values not in the list (shows as selected chip if match). */
  allowCustomHighlight?: boolean;
};

/**
 * Horizontal sliding chip picker for cities / locations.
 */
export function OptionSlider({
  options,
  value,
  onChange,
  testID,
  label,
  style,
  allowCustomHighlight = true,
}: OptionSliderProps) {
  const scrollRef = useRef<ScrollView>(null);
  const selected = value.trim();
  const selectedIndex = options.findIndex(
    (o) => o.toLowerCase() === selected.toLowerCase(),
  );

  useEffect(() => {
    if (selectedIndex < 0 || !scrollRef.current) return;
    const approxChip = 110;
    scrollRef.current.scrollTo({
      x: Math.max(0, selectedIndex * approxChip - 24),
      animated: true,
    });
  }, [selectedIndex]);

  return (
    <View
      style={[styles.wrap, style]}
      testID={testID}
      accessibilityRole="list"
      accessibilityLabel={label}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        {options.map((option) => {
          const isSelected =
            allowCustomHighlight &&
            selected.length > 0 &&
            selected.toLowerCase() === option.toLowerCase();
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={option}
              onPress={() => onChange(option)}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                pressed && { opacity: 0.9 },
                Platform.OS === "web" && styles.chipWeb,
              ]}
              testID={testID ? `${testID}-${slug(option)}` : undefined}
            >
              <Text
                style={[styles.chipText, isSelected && styles.chipTextSelected]}
                numberOfLines={1}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
    paddingRight: 16,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: t.radiusChip,
    backgroundColor: t.surfaceContainer,
    borderWidth: 1,
    borderColor: t.surfaceContainerHigh,
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: t.primary,
    borderColor: t.primary,
  },
  chipWeb: {
    cursor: "pointer",
  },
  chipText: {
    ...t.type.labelMd,
    color: t.textSecondary,
    fontFamily: t.font.space.semibold,
    fontSize: 13,
  },
  chipTextSelected: {
    color: t.onPrimary,
    fontFamily: t.font.space.bold,
  },
});
