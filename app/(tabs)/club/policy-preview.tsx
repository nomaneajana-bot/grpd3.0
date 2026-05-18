import { router, Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SessionJoinPolicyCard } from "@/components/club/SessionJoinPolicyCard";
import { colors, spacing, typography } from "@/constants/ui";
import type { ClubPaceGroupId } from "@/lib/clubPaceGroups";
import {
  buildLockedJoinMessage,
  buildWarnJoinMessage,
} from "@/lib/interGroupPolicy";

export default function ClubPolicyPreviewScreen() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const viewerGroup = (groupId ?? "B") as ClubPaceGroupId;
  const sessionGroup: ClubPaceGroupId = "A";

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Retour</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Ce que voit le runner</Text>
        <Text style={styles.subtitle}>
          Membre du Groupe {viewerGroup} sur une séance Groupe {sessionGroup}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SessionJoinPolicyCard
          scenarioLabel="SCÉNARIO 1 — VERROUILLÉ"
          state="locked"
          bannerMessage={buildLockedJoinMessage(sessionGroup)}
        />
        <SessionJoinPolicyCard
          scenarioLabel="SCÉNARIO 2 — AVERTISSEMENT"
          state="warn"
          bannerMessage={buildWarnJoinMessage(
            viewerGroup,
            sessionGroup,
            "4:00/km",
          )}
        />
        <SessionJoinPolicyCard
          scenarioLabel="SCÉNARIO 3 — LIBRE"
          state="free"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  backIcon: { color: colors.text.accent, fontSize: 18, marginRight: 6 },
  backLabel: { color: colors.text.accent, fontSize: 16, fontWeight: "500" },
  screenTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: 6,
    lineHeight: 18,
  },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xl,
  },
});
