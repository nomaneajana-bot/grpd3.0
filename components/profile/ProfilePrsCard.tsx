import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { PrSheetA } from "@/components/pr/PrSheetA";
import { stitoTheme as t } from "@/constants/stitoTheme";
import { formatRecordTime } from "@/lib/prHistory";
import { formatPaceColon } from "@/lib/profileMetrics";
import type { TestRecord } from "@/lib/profileStore";

type ProfilePrsCardProps = {
  records: TestRecord[];
  onSaveRecord: (record: TestRecord) => Promise<void> | void;
  onDeleteRecord?: (id: string) => Promise<void> | void;
};

function formatTestDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    const parts = iso.split("-").map(Number);
    if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function formatDistance(meters?: number | null): string | null {
  if (meters == null || meters <= 0) return null;
  if (meters >= 1000) {
    const km = meters / 1000;
    return Number.isInteger(km)
      ? `${km} km`
      : `${km.toFixed(1).replace(".", ",")} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Profile “Mes records” — manual PRs with add CTA (no GPS inventing).
 */
export function ProfilePrsCard({
  records,
  onSaveRecord,
  onDeleteRecord,
}: ProfilePrsCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<TestRecord | null>(null);

  const openAdd = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (record: TestRecord) => {
    setEditing(record);
    setSheetOpen(true);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.card} testID="profile-past-sessions">
        {records.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyTitle}>Aucun record pour l’instant</Text>
            <Text style={styles.emptyBody}>
              Ajoute tes chronos manuellement — 5K, 10K ou une distance perso.
            </Text>
          </View>
        ) : (
          records.map((record, index) => {
            const distance = formatDistance(record.distanceMeters);
            const dateLabel = formatTestDate(record.testDate);
            const sub = [
              distance,
              dateLabel,
              record.paceSecondsPerKm
                ? `${formatPaceColon(record.paceSecondsPerKm)}/km`
                : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <View key={record.id}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <Pressable
                  style={({ pressed }) => [
                    styles.row,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => openEdit(record)}
                  accessibilityRole="button"
                  accessibilityLabel={`Record ${record.label}`}
                  testID={`profile-pr-${record.id}`}
                >
                  <View style={styles.meta}>
                    <Text style={styles.label} numberOfLines={1}>
                      {record.label}
                    </Text>
                    {sub ? (
                      <Text style={styles.sub} numberOfLines={1}>
                        {sub}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.chrono}>{formatRecordTime(record)}</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </View>

      <Pressable
        onPress={openAdd}
        accessibilityRole="button"
        accessibilityLabel="Ajouter un record"
        style={({ pressed }) => [
          styles.addBtn,
          pressed && { opacity: 0.88 },
        ]}
        testID="profile-add-record"
      >
        <Ionicons name="add-circle-outline" size={18} color={t.primary} />
        <Text style={styles.addText}>Ajouter un record</Text>
      </Pressable>

      <PrSheetA
        visible={sheetOpen}
        test={editing}
        isAdding={!editing}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        onSave={(record) => {
          void onSaveRecord(record);
        }}
        onDelete={
          editing && onDeleteRecord
            ? () => {
                void onDeleteRecord(editing.id);
                setSheetOpen(false);
                setEditing(null);
              }
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
    gap: 8,
  },
  card: {
    backgroundColor: t.card,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(232,232,233,0.9)",
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  emptyBlock: {
    paddingTop: 12,
    paddingBottom: 12,
    gap: 4,
  },
  emptyTitle: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: t.text,
  },
  emptyBody: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.textSecondary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 12,
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    fontFamily: t.font.space.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: t.text,
  },
  sub: {
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.textSecondary,
  },
  chrono: {
    fontFamily: t.font.space.bold,
    fontSize: 16,
    lineHeight: 20,
    color: t.primary,
    fontVariant: ["tabular-nums"],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.outlineVariant,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: t.card,
    borderWidth: 1,
    borderColor: "rgba(0,95,52,0.2)",
  },
  addText: {
    fontFamily: t.font.space.semibold,
    fontSize: 14,
    color: t.primary,
  },
});
