import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";

import {
  memberGroupColor,
  sortedActiveColorGroups,
  type ClubColorGroup,
} from "@/lib/clubMemberGroups";
import type { ClubAdminSettings } from "@/lib/clubAdminStore";
import { stitoTheme as t } from "@/constants/stitoTheme";

type AssignMemberGroupSheetProps = {
  visible: boolean;
  memberName: string;
  settings: ClubAdminSettings;
  currentGroupId: string | null;
  onSelect: (groupId: string | null) => void;
  onClose: () => void;
};

/** Light bottom sheet to assign a member to one colour group (or none). */
export function AssignMemberGroupSheet({
  visible,
  memberName,
  settings,
  currentGroupId,
  onSelect,
  onClose,
}: AssignMemberGroupSheetProps) {
  const groups = sortedActiveColorGroups(settings);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.kicker}>
            {memberName === "Moi" ? "MON GROUPE" : "AFFECTER"}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {memberName}
          </Text>
          <Text style={styles.sub}>
            Choisis un groupe couleur — un seul, ou aucun.
          </Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {groups.map((g) => (
              <GroupChip
                key={g.id}
                group={g}
                selected={currentGroupId === g.id}
                onPress={() => onSelect(g.id)}
              />
            ))}
            <Pressable
              testID="assign-group-none"
              onPress={() => onSelect(null)}
              style={({ pressed }) => [
                styles.noneRow,
                currentGroupId == null && styles.noneSelected,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text
                style={[
                  styles.noneText,
                  currentGroupId == null && styles.noneTextSelected,
                ]}
              >
                Sans groupe
              </Text>
            </Pressable>
          </ScrollView>
          <Pressable
            onPress={onClose}
            style={styles.cancel}
            accessibilityRole="button"
            accessibilityLabel="Annuler"
          >
            <Text style={styles.cancelText}>Annuler</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function GroupChip({
  group,
  selected,
  onPress,
}: {
  group: ClubColorGroup;
  selected: boolean;
  onPress: () => void;
}) {
  const color = memberGroupColor(group.colorKey);
  return (
    <Pressable
      testID={`assign-group-${group.id}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && {
          borderColor: color,
          backgroundColor: `${color}14`,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.chipText}>
        <Text style={styles.chipName}>{group.name}</Text>
        {group.note ? (
          <Text style={styles.chipNote} numberOfLines={1}>
            {group.note}
          </Text>
        ) : null}
      </View>
      {selected ? <Text style={[styles.check, { color }]}>✓</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(26,28,29,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: t.card,
    borderTopLeftRadius: t.radiusXl,
    borderTopRightRadius: t.radiusXl,
    paddingHorizontal: t.space.lg,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: "72%",
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: t.surfaceContainerHigh,
    marginBottom: 14,
  },
  kicker: {
    color: t.primary,
    fontSize: 11,
    fontFamily: t.font.space.semibold,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  title: {
    color: t.text,
    fontSize: 22,
    fontFamily: t.font.space.bold,
    letterSpacing: -0.3,
  },
  sub: {
    color: t.textSecondary,
    fontSize: 13,
    fontFamily: t.font.hanken.regular,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
  },
  list: { maxHeight: 360 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.95)",
    backgroundColor: t.surfaceContainerLow,
    marginBottom: 8,
    minHeight: t.touchMin,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  chipText: { flex: 1, minWidth: 0 },
  chipName: {
    color: t.text,
    fontFamily: t.font.space.semibold,
    fontSize: 15,
  },
  chipNote: {
    color: t.outline,
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    marginTop: 2,
  },
  check: {
    fontFamily: t.font.space.bold,
    fontSize: 16,
  },
  noneRow: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.95)",
    backgroundColor: t.surfaceContainerLow,
    marginTop: 4,
    minHeight: t.touchMin,
    justifyContent: "center",
  },
  noneSelected: {
    borderColor: "rgba(0,95,52,0.35)",
    backgroundColor: "rgba(0,95,52,0.08)",
  },
  noneText: {
    color: t.textSecondary,
    fontFamily: t.font.hanken.semibold,
    fontSize: 14,
  },
  noneTextSelected: {
    color: t.primary,
  },
  cancel: {
    alignItems: "center",
    paddingTop: 16,
    minHeight: 44,
    justifyContent: "center",
  },
  cancelText: {
    color: t.outline,
    fontFamily: t.font.hanken.semibold,
    fontSize: 15,
  },
});
