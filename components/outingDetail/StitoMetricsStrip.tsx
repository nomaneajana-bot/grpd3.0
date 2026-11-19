import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

type Cell = {
  eyebrow: string;
  value: string;
  unit?: string;
  caption?: string;
  valueColor?: string;
};

type Props = {
  cells: Cell[];
};

export function StitoMetricsStrip({ cells }: Props) {
  if (!cells.length) return null;
  return (
    <View style={styles.wrap} testID="stito-metrics-strip">
      {cells.map((c, i) => (
        <React.Fragment key={c.eyebrow}>
          {i > 0 ? <View style={styles.divider} /> : null}
          <View style={styles.cell}>
            <Text style={styles.eyebrow}>{c.eyebrow}</Text>
            <View style={styles.valueRow}>
              <Text
                style={[styles.value, c.valueColor ? { color: c.valueColor } : null]}
              >
                {c.value}
              </Text>
              {c.unit ? <Text style={styles.unit}>{c.unit}</Text> : null}
            </View>
            {c.caption ? <Text style={styles.caption}>{c.caption}</Text> : null}
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: t.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.8)",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  cell: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 6,
    gap: 4,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: t.outlineVariant,
    marginVertical: 4,
  },
  eyebrow: {
    fontFamily: t.font.space.medium,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: t.textSecondary,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    flexWrap: "nowrap",
    maxWidth: "100%",
  },
  value: {
    fontFamily: t.font.space.bold,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.3,
    color: t.text,
    flexShrink: 1,
    textAlign: "center",
  },
  unit: {
    fontFamily: t.font.hanken.medium,
    fontSize: 12,
    lineHeight: 16,
    color: t.textSecondary,
    marginLeft: 2,
    flexShrink: 0,
  },
  caption: {
    fontFamily: t.font.hanken.regular,
    fontSize: 11,
    color: "rgba(63,73,65,0.8)",
  },
});
