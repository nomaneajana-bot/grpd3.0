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
import { borderRadius, colors, hairline, spacing, typography } from "@/constants/ui";

type AssignMemberGroupSheetProps = {
  visible: boolean;
  memberName: string;
  settings: ClubAdminSettings;
  currentGroupId: string | null;
  onSelect: (groupId: string | null) => void;
  onClose: () => void;
};

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.kicker}>AFFECTER</Text>
          <Text style={styles.title} numberOfLines={1}>
            {memberName}
          </Text>
          <Text style={styles.sub}>Choisis un groupe couleur — un seul, ou aucun.</Text>
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
              <Text style={styles.noneText}>Sans groupe</Text>
            </Pressable>
          </ScrollView>
          <Pressable onPress={onClose} style={styles.cancel}>
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
        selected && { borderColor: color, backgroundColor: `${color}22` },
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
      {selected ? <Text style={styles.check}>✓</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 20,
    paddingBottom: 28,
    maxHeight: "72%",
  },
  kicker: {
    color: colors.text.accent,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  title: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: "800",
  },
  sub: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: 6,
    marginBottom: 16,
  },
  list: { maxHeight: 360 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    marginBottom: 8,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  chipText: { flex: 1 },
  chipName: {
    color: colors.text.primary,
    fontWeight: "700",
    fontSize: typography.sizes.base,
  },
  chipNote: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  check: {
    color: colors.accent.primary,
    fontWeight: "800",
    fontSize: 16,
  },
  noneRow: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    marginTop: 4,
  },
  noneSelected: {
    borderColor: colors.accent.primary,
  },
  noneText: {
    color: colors.text.secondary,
    fontWeight: "600",
  },
  cancel: {
    alignItems: "center",
    paddingTop: 16,
  },
  cancelText: {
    color: colors.text.secondary,
    fontWeight: "600",
  },
});
