import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

export type SectionSegment = {
  id: string;
  label: string;
};

type SectionSegmentBarProps = {
  segments: SectionSegment[];
  value: string;
  onChange: (id: string) => void;
  testID?: string;
};

/**
 * Horizontal section switcher — underline segments (Stito), not rounded-full pills.
 * Keeps long admin surfaces to one job at a time.
 */
export function SectionSegmentBar({
  segments,
  value,
  onChange,
  testID = "section-segment-bar",
}: SectionSegmentBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      testID={testID}
    >
      {segments.map((seg) => {
        const on = value === seg.id;
        return (
          <Pressable
            key={seg.id}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={seg.label}
            onPress={() => onChange(seg.id)}
            style={({ pressed }) => [styles.tab, pressed && { opacity: 0.85 }]}
            testID={`${testID}-${seg.id}`}
          >
            <Text style={[styles.tabText, on && styles.tabTextOn]}>
              {seg.label}
            </Text>
            <View style={[styles.underline, on && styles.underlineOn]} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    paddingBottom: 2,
    minHeight: 40,
  },
  tab: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingTop: 6,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  tabText: {
    fontFamily: t.font.hanken.medium,
    fontSize: 14,
    lineHeight: 18,
    color: t.outline,
  },
  tabTextOn: {
    fontFamily: t.font.hanken.semibold,
    color: t.primary,
  },
  underline: {
    height: 2,
    alignSelf: "stretch",
    borderRadius: 1,
    backgroundColor: "transparent",
  },
  underlineOn: {
    backgroundColor: t.primary,
  },
});
