import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Slider from "@react-native-community/slider";

import {
  formatPaceMinPerKm,
  PACE_REFERENCES,
  paceMinutesToSlider,
  sliderToPaceMinutes,
} from "@/lib/paceFormat";
import { nearestPaceReference } from "@/lib/paceNearestRef";
import { borderRadius, colors, hairline, typography } from "@/constants/ui";

type PacePickerProps = {
  paceMinutes: number;
  onPaceChange: (minutes: number) => void;
};

/**
 * Optional running personalization. Slider and reference rows share one value —
 * the highlighted card is always the nearest reference to the slider.
 * No invented club group (A–D) assignment during onboarding.
 */
export function PacePicker({ paceMinutes, onPaceChange }: PacePickerProps) {
  const slider = paceMinutesToSlider(paceMinutes);
  const nearest = useMemo(
    () => nearestPaceReference(paceMinutes),
    [paceMinutes],
  );

  return (
    <View testID="onboarding-pace-picker">
      <View style={styles.heroCard}>
        <Text style={styles.paceHero} testID="onboarding-pace-value">
          {formatPaceMinPerKm(paceMinutes)}
        </Text>
        <Text style={styles.optionalHint}>
          Optionnel — seulement si tu cours et veux une allure de départ.
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={slider}
          onValueChange={(v) => onPaceChange(sliderToPaceMinutes(v))}
          minimumTrackTintColor={colors.accent.primary}
          maximumTrackTintColor={colors.surface.s4}
          thumbTintColor={colors.accent.primary}
          testID="onboarding-pace-slider"
        />
        <View style={styles.scale}>
          <Text style={styles.scaleText}>3'30</Text>
          <Text style={styles.scaleText}>5'00</Text>
          <Text style={styles.scaleText}>6'30</Text>
          <Text style={styles.scaleText}>8'00+</Text>
        </View>
      </View>
      <View style={styles.refs}>
        {PACE_REFERENCES.map((ref) => {
          const selected = nearest.id === ref.id;
          return (
            <Pressable
              key={ref.id}
              testID={`onboarding-pace-ref-${ref.id}`}
              onPress={() => onPaceChange(ref.minutes)}
              style={[
                styles.refRow,
                selected && styles.refRowSelected,
                Platform.OS === "web" && styles.refWeb,
              ]}
            >
              <Text style={[styles.refTime, selected && styles.refTimeSelected]}>
                {Math.floor(ref.minutes)}'
                {String(Math.round((ref.minutes % 1) * 60)).padStart(2, "0")}
              </Text>
              <View style={styles.refTextCol}>
                <Text
                  style={[styles.refLabel, selected && styles.refLabelSelected]}
                >
                  {ref.label}
                </Text>
                {ref.hint && selected ? (
                  <Text style={styles.refHint}>{ref.hint}</Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.surface.s2,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    padding: 16,
    marginBottom: 12,
  },
  paceHero: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    marginBottom: 8,
  },
  optionalHint: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: 18,
    marginBottom: 12,
  },
  slider: {
    width: "100%",
    height: 36,
  },
  scale: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  scaleText: {
    color: colors.text.tertiary,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  refs: {
    gap: 4,
  },
  refRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
  },
  refRowSelected: {
    backgroundColor: colors.surface.s3,
  },
  refWeb: {
    cursor: "pointer",
  },
  refTime: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    minWidth: 36,
  },
  refTimeSelected: {
    color: colors.text.primary,
  },
  refTextCol: {
    flex: 1,
  },
  refLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
    fontWeight: "600",
  },
  refLabelSelected: {
    color: colors.text.primary,
  },
  refHint: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: 4,
    fontStyle: "italic",
  },
});
