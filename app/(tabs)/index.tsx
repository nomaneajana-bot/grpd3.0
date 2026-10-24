import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DiscoveryFilters } from "@/components/home/DiscoveryFilters";
import { HomeHeader } from "@/components/home/HomeHeader";
import { NewMemberIntro } from "@/components/home/NewMemberIntro";
import {
  NextOutingCard,
  NextOutingSectionHeader,
} from "@/components/home/NextOutingCard";
import { OrganiseAction } from "@/components/home/OrganiseAction";
import { OutingRow } from "@/components/home/OutingRow";
import { homeTheme as h } from "@/constants/homeTheme";
import { createApiClient, getMyMemberships, listSessions } from "@/lib/api";
import {
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
import { setMesSortiesBadgeCount } from "@/lib/mesSortiesBadge";
import {
  apiSessionToSessionData,
  getAllSessionsIncludingStored,
  type SessionData,
} from "@/lib/sessionData";
import { getUserSessions } from "@/lib/sessionStore";
import type { ClubMembership } from "@/types/api";

/**
 * Authenticated Accueil — Google Stitch / Noa-Stito composition.
 * Tokens: constants/homeTheme.ts.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
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

  useEffect(() => {
    setMesSortiesBadgeCount(upcomingJoinedCount);
  }, [upcomingJoinedCount]);

  const openSession = (id: string) => {
    router.push(`/session/${id}` as Href);
  };

  const scrollToDiscovery = () => {
    discoveryAnchorRef.current?.measureInWindow((_x, y) => {
      const target = Math.max(0, y - 72);
      scrollRef.current?.scrollTo({ y: target, animated: true });
    });
  };

  const tabBarReserve = 54 + Math.max(insets.bottom, 10) + 18;

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
          onCityPress={() => {}}
          onCitySelect={(city) => setQuery(city)}
          profileInitial="Y"
        />

        {mode === "new_member" && !nextOuting ? (
          <NewMemberIntro onSeeOutings={scrollToDiscovery} />
        ) : null}

        {nextOuting ? (
          <View style={styles.nextBlock}>
            <NextOutingSectionHeader
              reserved={nextOuting.attendanceStatus === "joined"}
            />
            <NextOutingCard
              session={nextOuting}
              onPress={() => openSession(nextOuting.id)}
            />
          </View>
        ) : null}

        <View style={styles.hairline} />

        <OrganiseAction
          onPress={() => router.push("/session/create" as Href)}
        />

        <View ref={discoveryAnchorRef} collapsable={false} style={styles.section}>
          <Text style={styles.sectionTitle} testID="home-discovery-title">
            Sorties à découvrir
          </Text>

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
              {discovery.map((s, i) => (
                <OutingRow
                  key={s.id}
                  session={s}
                  onPress={() => openSession(s.id)}
                  showRule={i < discovery.length - 1}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: h.canvas },
  content: {
    paddingHorizontal: 20,
    paddingTop: h.space.sm,
    gap: h.space.lg,
    width: "100%",
    maxWidth: 960,
    alignSelf: "center",
  },
  nextBlock: { gap: 8 },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(190,202,190,0.45)",
    marginVertical: 4,
  },
  section: { gap: h.space.sm, marginTop: 4 },
  sectionTitle: {
    fontFamily: h.font.space.bold,
    fontSize: 18,
    lineHeight: 24,
    color: h.text,
  },
  list: { marginTop: 4 },
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
    paddingVertical: h.space.lg,
    gap: 8,
  },
  emptyTitle: { ...h.type.label, fontSize: 16, color: h.text },
  emptyBody: { ...h.type.bodySm, color: h.textSecondary },
});
