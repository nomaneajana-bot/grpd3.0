import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Kicker } from "@/components/redesign/Kicker";
import { monoFontFamily, redesignTheme } from "@/constants/redesignTheme";
import type { TimelineSegment } from "@/lib/workoutTimeline";
import {
  formatTimelineAxis,
  getTimelineTotalSeconds,
} from "@/lib/workoutTimeline";

type WorkoutTimelineProps = {
  segments: TimelineSegment[];
};

const SEGMENT_COLORS: Record<TimelineSegment["kind"], string> = {
  warmup: "rgba(255,255,255,0.14)",
  effort: redesignTheme.accent.blue,
  recovery: "rgba(255,255,255,0.10)",
  cooldown: "rgba(255,255,255,0.14)",
};

export function WorkoutTimeline({ segments }: WorkoutTimelineProps) {
  const totalSeconds = getTimelineTotalSeconds(segments);
  const axis = formatTimelineAxis(totalSeconds);
  const segmentCount = segments.length;

  const bars = useMemo(() => {
    if (totalSeconds <= 0) return [];
    return segments.map((seg) => ({
      ...seg,
      flex: Math.max(seg.durationSeconds / totalSeconds, 0.02),
    }));
  }, [segments, totalSeconds]);

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Kicker>TIMELINE</Kicker>
        <Text style={styles.segmentCount}>
          {segmentCount > 0 ? `${segmentCount} segments` : "—"}
        </Text>
      </View>
      <View style={styles.card}>
        {bars.length > 0 ? (
          <View style={styles.barRow}>
            {bars.map((bar) => (
              <View
                key={bar.id}
                style={[
                  styles.bar,
                  {
                    flex: bar.flex,
                    backgroundColor: SEGMENT_COLORS[bar.kind],
                  },
                ]}
              >
                {bar.paceLabel && bar.kind === "effort" ? (
                  <Text style={styles.barPace} numberOfLines={1}>
                    {bar.paceLabel}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              Ajoutez des étapes pour voir la timeline
            </Text>
          </View>
        )}
        <View style={styles.axisRow}>
          <Text style={styles.axis}>{axis[0]}</Text>
          <Text style={styles.axis}>{axis[1]}</Text>
          <Text style={styles.axis}>{axis[2]}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    paddingBottom: 20,
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  segmentCount: {
    fontFamily: monoFontFamily,
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.5,
    color: redesignTheme.text.faint,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: redesignTheme.card.backgroundElevated,
    borderRadius: redesignTheme.card.radiusLg,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: redesignTheme.card.border,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 56,
    gap: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  bar: {
    minWidth: 4,
    borderRadius: 4,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 4,
  },
  barPace: {
    fontFamily: monoFontFamily,
    fontSize: 8,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    transform: [{ rotate: "-90deg" }],
    width: 32,
    textAlign: "center",
  },
  placeholder: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 12,
    color: redesignTheme.text.faint,
  },
  axisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  axis: {
    fontFamily: monoFontFamily,
    fontSize: 10,
    color: redesignTheme.text.faint,
  },
});
