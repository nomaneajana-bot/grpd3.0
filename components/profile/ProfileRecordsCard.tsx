import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { colors, typography } from "@/constants/ui";
import { formatPaceColon } from "@/lib/profileMetrics";
import type { TestRecord } from "@/lib/profileStore";
import { formatDateForList, formatDurationLabel } from "@/lib/testHelpers";

type ProfileRecordsCardProps = {
  tests: TestRecord[];
  onAdd: () => void;
  onPressRecord: () => void;
};

export function ProfileRecordsCard({
  tests,
  onAdd,
  onPressRecord,
}: ProfileRecordsCardProps) {
  const preview = tests.slice(0, 3);

  return (
    <Card style={styles.card}>
      {preview.length === 0 ? (
        <Text style={styles.empty}>Pas de PR pour l&apos;instant.</Text>
      ) : (
        preview.map((test, index) => {
          const paceDisplay = formatPaceColon(test.paceSecondsPerKm);
          const timeDisplay =
            test.durationSeconds != null
              ? formatDurationLabel(test.durationSeconds)
              : "—";
          const dateLabel = test.testDate
            ? formatDateForList(test.testDate)
            : "À définir";
          return (
            <React.Fragment key={test.id}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <Pressable
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                ]}
                onPress={onPressRecord}
              >
                <View style={styles.left}>
                  <Text style={styles.name}>{test.label}</Text>
                  <Text style={styles.date}>{dateLabel}</Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.time}>{timeDisplay}</Text>
                  <Text style={styles.pace}>{paceDisplay}</Text>
                </View>
              </Pressable>
            </React.Fragment>
          );
        })
      )}
      {preview.length > 0 ? <View style={styles.divider} /> : null}
      <Pressable
        style={({ pressed }) => [styles.addBtn, pressed && styles.rowPressed]}
        onPress={onAdd}
      >
        <Text style={styles.addText}>+ Ajouter un PR</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 9,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  rowPressed: {
    opacity: 0.7,
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: typography.sizes.base,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 2,
  },
  date: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  right: {
    alignItems: "flex-end",
    minWidth: 72,
  },
  time: {
    fontSize: typography.sizes.base,
    fontWeight: "700",
    color: colors.accent.primary,
    marginBottom: 2,
  },
  pace: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
  },
  empty: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    paddingVertical: 8,
  },
  addBtn: {
    paddingTop: 12,
    alignItems: "center",
  },
  addText: {
    fontSize: typography.sizes.base,
    fontWeight: "600",
    color: colors.accent.primary,
  },
});
