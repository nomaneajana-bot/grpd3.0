import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActivitySummary } from "@/components/home/ActivitySummary";
import { DiscoveryFilters } from "@/components/home/DiscoveryFilters";
import { HomeHeader } from "@/components/home/HomeHeader";
import { NewMemberIntro } from "@/components/home/NewMemberIntro";
import { NextOutingCard } from "@/components/home/NextOutingCard";
import { OrganiseAction } from "@/components/home/OrganiseAction";
import { OutingRow } from "@/components/home/OutingRow";
import { homeTheme as h } from "@/constants/homeTheme";
import { createApiClient, getMyMemberships, listSessions } from "@/lib/api";
import {
  buildHomeStats,
  countApprovedClubs,
  countCompletedOutings,
  countConfirmedUpcoming,
  filterDiscoverySessions,
  formatHomeDayEyebrow,
  joinedIdSet,
  resolveCityLabel,
  resolveHomeMode,
  selectNextOuting,
  type HomeActivityFilter,
} from "@/lib/homeViewModel";
import { getJoinedSessions } from "@/lib/joinedSessionsStore";
import {
  apiSessionToSessionData,
  getAllSessionsIncludingStored,
  type SessionData,
} from "@/lib/sessionData";
import { getUserSessions } from "@/lib/sessionStore";
import type { ClubMembership } from "@/types/api";

/**
 * Authenticated Accueil — Stitch refinement (active / new-member hierarchy).
 * Tokens: constants/homeTheme.ts (export config). Dark green-home theme unchanged elsewhere.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const searchRef = useRef<TextInput>(null);
  const discoveryAnchorRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);

  const [activityFilter, setActivityFilter] =
    useState<HomeActivityFilter>("all");
  const [query, setQuery] = useState("");
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const client = createApiClient();
    const results = await Promise.allSettled([
      listSessions(client, { from }),
      getUserSessions().catch(async () => getAllSessionsIncludingStored()),
      getAllSessionsIncludingStored(),
      getJoinedSessions(),
      getMyMemberships(client),
    ]);

    const merged = new Map<string, SessionData>();
    const absorb = (list: SessionData[]) => {
      list.forEach((s) => merged.set(s.id, s));
    };
    if (results[2].status === "fulfilled") absorb(results[2].value);
    if (results[1].status === "fulfilled") absorb(results[1].value);
    if (results[0].status === "fulfilled") {
      absorb(
        (results[0].value.sessions ?? []).map(apiSessionToSessionData),
      );
    }

    // Annotate joined attendance from local join store when API left it unset
    const joined =
      results[3].status === "fulfilled" ? results[3].value : [];
    const jids = joinedIdSet(joined);
    for (const id of jids) {
      const s = merged.get(id);
      if (s && !s.attendanceStatus) {
        merged.set(id, { ...s, attendanceStatus: "joined" });
      }
    }

    setSessions([...merged.values()]);
    setJoinedIds(jids);
    if (results[4].status === "fulfilled") {
      setMemberships(results[4].value.memberships ?? []);
    } else {
      setMemberships([]);
    }
    setError(results[0].status === "rejected");
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const nextOuting = useMemo(
    () => selectNextOuting(sessions, joinedIds),
    [sessions, joinedIds],
  );
  const upcomingJoinedCount = useMemo(
    () => countConfirmedUpcoming(sessions, joinedIds),
    [sessions, joinedIds],
  );
  const completedCount = useMemo(
    () => countCompletedOutings(sessions, joinedIds),
    [sessions, joinedIds],
  );
  const approvedClubCount = useMemo(
    () => countApprovedClubs(memberships),
    [memberships],
  );
  const mode = useMemo(
    () =>
      resolveHomeMode({
        nextOuting,
        approvedClubCount,
        completedCount,
        upcomingJoinedCount,
      }),
    [nextOuting, approvedClubCount, completedCount, upcomingJoinedCount],
  );
  const stats = useMemo(
    () =>
      buildHomeStats({
        upcomingJoinedCount,
        approvedClubCount,
        completedCount,
      }),
    [upcomingJoinedCount, approvedClubCount, completedCount],
  );
  const discovery = useMemo(
    () =>
      filterDiscoverySessions(
        sessions,
        activityFilter,
        query,
        nextOuting?.id ?? null,
      ),
    [sessions, activityFilter, query, nextOuting?.id],
  );
  const cityLabel = useMemo(
    () => resolveCityLabel({ memberships, query }),
    [memberships, query],
  );
  const dayEyebrow = useMemo(
    () => formatHomeDayEyebrow(nextOuting?.dateISO ?? null),
    [nextOuting?.dateISO],
  );

  const openSession = (id: string) => {
    router.push(`/session/${id}` as Href);
  };

  const scrollToDiscovery = () => {
    discoveryAnchorRef.current?.measureInWindow((_x, y) => {
      // Approximate: scroll so discovery section is near top under header.
      const target = Math.max(0, y - 72);
      scrollRef.current?.scrollTo({ y: target, animated: true });
    });
  };

  const tabBarReserve = 56 + Math.max(insets.bottom, 10) + 18;

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top"]}
      testID="home-accueil"
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarReserve },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void load()}
            tintColor={h.primary}
          />
        }
      >
        <HomeHeader
          cityLabel={cityLabel}
          dayEyebrow={dayEyebrow}
          query={query}
          onQueryChange={setQuery}
          onCityPress={() => searchRef.current?.focus()}
          searchInputRef={searchRef}
        />

        {mode === "new_member" ? (
          <NewMemberIntro onSeeOutings={scrollToDiscovery} />
        ) : null}

        {mode === "active_with_next" && nextOuting ? (
          <NextOutingCard
            session={nextOuting}
            onPress={() => openSession(nextOuting.id)}
          />
        ) : null}

        {mode !== "new_member" ? <ActivitySummary stats={stats} /> : null}

        <View ref={discoveryAnchorRef} collapsable={false} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} testID="home-discovery-title">
              Sorties à découvrir
            </Text>
          </View>

          <DiscoveryFilters
            value={activityFilter}
            onChange={setActivityFilter}
          />

          {error ? (
            <View style={styles.errorBox} testID="home-error">
              <Text style={styles.errorText}>
                Les sorties en ligne ne sont pas disponibles pour le moment.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Réessayer"
                onPress={() => void load()}
                style={styles.retryBtn}
                testID="home-retry"
              >
                <Text style={styles.retryText}>Réessayer</Text>
              </Pressable>
            </View>
          ) : null}

          {loading && !sessions.length ? (
            <ActivityIndicator color={h.primary} style={{ marginVertical: 24 }} />
          ) : discovery.length ? (
            <View style={styles.list} testID="home-discovery-list">
              {discovery.map((s) => (
                <OutingRow
                  key={s.id}
                  session={s}
                  onPress={() => openSession(s.id)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.empty} testID="home-discovery-empty">
              <Text style={styles.emptyTitle}>
                {query || activityFilter !== "all"
                  ? "Pas encore de sortie pour cette recherche."
                  : "Pas encore de sortie à découvrir."}
              </Text>
              <Text style={styles.emptyBody}>
                {mode === "new_member"
                  ? "Reviens bientôt, ou organise la première."
                  : "Propose une marche ou une course et invite ton groupe."}
              </Text>
            </View>
          )}
        </View>

        <OrganiseAction
          onPress={() => router.push("/session/create" as Href)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: h.canvas },
  content: {
    paddingHorizontal: h.space.xl,
    paddingTop: h.space.md,
    gap: h.space.xl,
    width: "100%",
    maxWidth: 960,
    alignSelf: "center",
  },
  section: { gap: h.space.md },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { ...h.type.section, color: h.text },
  list: { gap: h.space.md },
  errorBox: {
    backgroundColor: "#FDECEA",
    borderRadius: h.radiusDiscovery,
    padding: h.space.lg,
    gap: 12,
  },
  errorText: { ...h.type.bodySm, color: h.danger },
  retryBtn: {
    alignSelf: "flex-start",
    minHeight: h.touchMin,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: h.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: { ...h.type.label, color: h.danger },
  empty: {
    backgroundColor: h.card,
    borderRadius: h.radiusDiscovery,
    borderWidth: 1,
    borderColor: h.outline,
    padding: h.space.lg,
    gap: 8,
  },
  emptyTitle: { ...h.type.label, fontSize: 16, color: h.text },
  emptyBody: { ...h.type.bodySm, color: h.textSecondary },
});
