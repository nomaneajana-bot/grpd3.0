import { Stack, router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { stitoTheme as t } from "../../constants/stitoTheme";
import { createApiClient, getMyMemberships, getMySessions } from "../../lib/api";
import type { ClubMembership } from "../../types/api";
import type { SessionData } from "../../lib/sessionData";
import { apiSessionToSessionData } from "../../lib/sessionData";

type InboxItem = {
  id: string;
  title: string;
  subtitle: string;
  type: "request" | "suggestion" | "membership";
  actionLabel: string;
  actionPath: string;
};

/**
 * Inbox / invitations list — Stito light.
 * No VIP tabs; pending membership never implies outing registration.
 */
export default function InboxScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const client = createApiClient();
      const [membershipsResult, mySessionsResult] = await Promise.all([
        getMyMemberships(client),
        getMySessions(client),
      ]);
      setMemberships(membershipsResult.memberships ?? []);
      setSessions((mySessionsResult.sessions ?? []).map(apiSessionToSessionData));
    } catch (error) {
      console.warn("Failed to load inbox data:", error);
      setMemberships([]);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const inboxItems = useMemo<InboxItem[]>(() => {
    const items: InboxItem[] = [];

    for (const membership of memberships) {
      if (membership.status === "pending") {
        items.push({
          id: `membership-${membership.id}`,
          title: "Demande club en attente",
          subtitle: membership.club?.name
            ? `Ta demande pour ${membership.club.name} est en attente. L’adhésion n’inscrit à aucune sortie.`
            : "Ta demande d'accès club est en attente. L’adhésion n’inscrit à aucune sortie.",
          type: "membership",
          actionLabel: "Voir club",
          actionPath: "/club",
        });
      }
    }

    for (const session of sessions) {
      if (session.attendanceStatus === "requested") {
        items.push({
          id: `session-requested-${session.id}`,
          title: "Demande de participation envoyée",
          subtitle: `${session.title} · ${session.dateLabel}`,
          type: "request",
          actionLabel: "Voir séance",
          actionPath: `/session/${session.id}`,
        });
      }
      if (session.attendanceStatus === "suggested") {
        items.push({
          id: `session-suggested-${session.id}`,
          title: "Groupe suggéré par le coach",
          subtitle: `${session.title} · ${session.dateLabel}`,
          type: "suggestion",
          actionLabel: "Voir séance",
          actionPath: `/session/${session.id}`,
        });
      }
    }

    return items;
  }, [memberships, sessions]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backRow}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Invitations</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            tintColor={t.primary}
            refreshing={isLoading}
            onRefresh={loadData}
          />
        }
      >
        {inboxItems.length === 0 && !isLoading ? (
          <View style={styles.card}>
            <Text style={styles.emptyTitle}>Rien de nouveau</Text>
            <Text style={styles.emptySubtitle}>
              Les demandes, suggestions et mises à jour apparaîtront ici.
            </Text>
          </View>
        ) : (
          inboxItems.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.itemAction,
                  pressed && styles.itemActionPressed,
                ]}
                onPress={() => router.push(item.actionPath as never)}
              >
                <Text style={styles.itemActionText}>{item.actionLabel}</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: t.canvas,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: t.canvas,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  backIcon: {
    color: t.primary,
    fontSize: 18,
    marginRight: 4,
  },
  backLabel: {
    color: t.primary,
    fontSize: 16,
    fontFamily: t.font.space.semibold,
  },
  screenTitle: {
    ...t.type.pageTitle,
    color: t.text,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 12,
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    padding: 16,
  },
  emptyTitle: {
    color: t.text,
    fontSize: 18,
    fontFamily: t.font.space.bold,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: t.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: t.font.hanken.regular,
  },
  itemTitle: {
    color: t.text,
    fontSize: 16,
    fontFamily: t.font.space.bold,
    marginBottom: 6,
  },
  itemSubtitle: {
    color: t.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: t.font.hanken.regular,
  },
  itemAction: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: t.radiusChip,
    borderWidth: 1,
    borderColor: t.outlineVariant,
    backgroundColor: t.surfaceContainerLow,
  },
  itemActionPressed: {
    opacity: 0.8,
  },
  itemActionText: {
    color: t.primary,
    fontSize: 13,
    fontFamily: t.font.space.bold,
  },
});
