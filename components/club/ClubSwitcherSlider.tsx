import React, { useEffect, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";

import { stitoTheme as t } from "@/constants/stitoTheme";
import type { ClubMembership } from "@/types/api";

type ClubSwitcherSliderProps = {
  memberships: ClubMembership[];
  activeClubId: string | null | undefined;
  onSelect: (clubId: string) => void;
  onJoinPress?: () => void;
  showJoinChip?: boolean;
  testID?: string;
};

/**
 * Single-row horizontal club picker — scrolls instead of wrapping chips.
 */
export function ClubSwitcherSlider({
  memberships,
  activeClubId,
  onSelect,
  onJoinPress,
  showJoinChip = true,
  testID = "club-switcher-slider",
}: ClubSwitcherSliderProps) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = memberships.findIndex((m) => m.clubId === activeClubId);

  useEffect(() => {
    if (selectedIndex < 0 || !scrollRef.current) return;
    scrollRef.current.scrollTo({
      x: Math.max(0, selectedIndex * 140 - 28),
      animated: true,
    });
  }, [selectedIndex, activeClubId]);

  return (
    <View style={styles.wrap} testID={testID}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
        accessibilityRole="list"
        accessibilityLabel="Mes clubs"
      >
        {memberships.map((m, index) => {
          const active = m.clubId === activeClubId;
          const pending = m.status === "pending";
          const label = m.club?.name ?? "Club";
          return (
            <Animated.View
              key={m.clubId}
              entering={FadeInRight.delay(30 + index * 40)
                .duration(260)
                .springify()
                .damping(18)}
            >
              <Pressable
                testID={`club-switch-${m.clubId}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={
                  pending ? `${label}, demande en attente` : label
                }
                onPress={() => onSelect(m.clubId)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipOn,
                  pending && !active && styles.chipPending,
                  pressed && { opacity: 0.88 },
                ]}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextOn]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
                {pending ? (
                  <Text
                    style={[
                      styles.chipMeta,
                      active && styles.chipMetaOn,
                    ]}
                  >
                    attente
                  </Text>
                ) : null}
              </Pressable>
            </Animated.View>
          );
        })}
        {showJoinChip && onJoinPress ? (
          <Pressable
            testID="club-find-chip"
            accessibilityRole="button"
            accessibilityLabel="Rejoindre un autre club"
            onPress={onJoinPress}
            style={({ pressed }) => [
              styles.joinChip,
              pressed && { opacity: 0.88 },
            ]}
          >
            <Text style={styles.joinChipText}>+ Rejoindre</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: -16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 2,
    paddingRight: 28,
  },
  chip: {
    borderRadius: t.radiusChip,
    borderWidth: 1,
    borderColor: t.outlineVariant,
    backgroundColor: t.card,
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 44,
    maxWidth: 220,
    justifyContent: "center",
  },
  chipOn: {
    backgroundColor: t.primary,
    borderColor: t.primary,
  },
  chipPending: {
    borderStyle: "dashed",
  },
  chipText: {
    color: t.text,
    fontSize: 14,
    fontFamily: t.font.space.semibold,
  },
  chipTextOn: {
    color: t.onPrimary,
  },
  chipMeta: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: t.font.hanken.medium,
    color: t.outline,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  chipMetaOn: {
    color: "rgba(255,255,255,0.75)",
  },
  joinChip: {
    borderRadius: t.radiusChip,
    borderWidth: 1,
    borderColor: t.outlineVariant,
    borderStyle: "dashed",
    backgroundColor: t.surfaceContainerLow,
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 44,
    justifyContent: "center",
  },
  joinChipText: {
    color: t.primary,
    fontSize: 14,
    fontFamily: t.font.space.semibold,
  },
});
