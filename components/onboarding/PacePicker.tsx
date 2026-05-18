import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Slider from "@react-native-community/slider";

import {
  formatPaceMinPerKm,
  PACE_REFERENCES,
  paceMinutesToSlider,
  sliderToPaceMinutes,
} from "@/lib/paceFormat";
import type { ClubPaceGroupId } from "@/lib/clubPaceGroups";
import { getClubPaceGroupDef } from "@/lib/clubPaceGroups";
import { borderRadius, colors, hairline, typography } from "@/constants/ui";

type PacePickerProps = {
  paceMinutes: number;
  onPaceChange: (minutes: number) => void;
  selectedRefId?: string;
  onRefSelect?: (refId: string, minutes: number) => void;
};

export function PacePicker({
  paceMinutes,
  onPaceChange,
  selectedRefId = "run",
  onRefSelect,
}: PacePickerProps) {
  const slider = paceMinutesToSlider(paceMinutes);
  const groupId = paceMinutes < 4.5 ? "A" : paceMinutes < 5.5 ? "B" : paceMinutes < 7 ? "C" : "D";
  const group = getClubPaceGroupDef(groupId as ClubPaceGroupId);

  return (
    <View>
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <Text style={styles.paceHero}>{formatPaceMinPerKm(paceMinutes)}</Text>
          <View style={[styles.groupBadge, { backgroundColor: group.dotColor }]}>
            <Text style={styles.groupLetter}>{groupId}</Text>
          </View>
        </View>
        <View style={styles.groupRow}>
          <View style={[styles.dot, { backgroundColor: group.dotColor }]} />
          <Text style={styles.groupLabel}>
            Groupe {groupId} — {group.label.replace(/^Groupe [A-D] — /, "")}
          </Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={slider}
          onValueChange={(v) => onPaceChange(sliderToPaceMinutes(v))}
          minimumTrackTintColor={colors.accent.primary}
          maximumTrackTintColor={colors.surface.s4}
          thumbTintColor={colors.accent.primary}
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
          const selected = selectedRefId === ref.id;
          return (
            <Pressable
              key={ref.id}
              onPress={() => {
                onPaceChange(ref.minutes);
                onRefSelect?.(ref.id, ref.minutes);
              }}
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
                <Text style={[styles.refLabel, selected && styles.refLabelSelected]}>
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
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  paceHero: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  groupBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  groupLetter: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  groupLabel: {
    color: colors.text.accent,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
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
