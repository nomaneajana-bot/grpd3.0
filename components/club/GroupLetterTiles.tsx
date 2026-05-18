import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";
import {
  CLUB_PACE_GROUP_DEFS,
  type ClubPaceGroupId,
} from "@/lib/clubPaceGroups";

const SHORT_SUB: Record<ClubPaceGroupId, string> = {
  A: "Élite",
  B: "Inter.",
  C: "Déc.",
  D: "Social",
};

type GroupLetterTilesProps = {
  selectedId: ClubPaceGroupId;
  onSelect: (id: ClubPaceGroupId) => void;
  disabledIds?: ClubPaceGroupId[];
  /** When true, inactive letters cannot be selected (create flow) */
  lockInactive?: boolean;
  activeById?: Partial<Record<ClubPaceGroupId, boolean>>;
};

export function GroupLetterTiles({
  selectedId,
  onSelect,
  disabledIds = [],
  lockInactive = false,
  activeById = {},
}: GroupLetterTilesProps) {
  return (
    <View style={styles.row}>
      {CLUB_PACE_GROUP_DEFS.map((def) => {
        const isActive = activeById[def.id] ?? true;
        const disabled =
          disabledIds.includes(def.id) || (lockInactive && !isActive);
        const selected = selectedId === def.id;
        return (
          <Pressable
            key={def.id}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            onPress={() => onSelect(def.id)}
            style={({ pressed }) => [
              styles.tile,
              selected && styles.tileSelected,
              disabled && styles.tileDisabled,
              pressed && !disabled && styles.tilePressed,
              Platform.OS === "web" && !disabled && styles.tileWeb,
            ]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: def.dotColor },
                selected && styles.dotSelected,
              ]}
            />
            <Text style={[styles.letter, selected && styles.letterSelected]}>
              {def.id}
            </Text>
            <Text style={styles.sub}>{SHORT_SUB[def.id]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
  tile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.s2,
    gap: 4,
  },
  tileSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primaryDim,
  },
  tilePressed: {
    borderColor: colors.border.active,
    backgroundColor: colors.background.elevated2,
  },
  tileDisabled: {
    opacity: 0.35,
  },
  tileWeb: {
    cursor: "pointer",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.85,
  },
  dotSelected: {
    opacity: 1,
    transform: [{ scale: 1.15 }],
  },
  letter: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: "700",
  },
  letterSelected: {
    color: colors.text.accent,
  },
  sub: {
    color: colors.text.secondary,
    fontSize: 10,
    textAlign: "center",
  },
});
