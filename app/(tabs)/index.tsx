import { type Href, router, useFocusEffect } from "expo-router";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Animated,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import type { TextStyle, ViewStyle } from "react-native";

import * as Haptics from "expo-haptics";

import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";
import { LoadingState } from "../../components/ui/LoadingState";
import { CoachBubble } from "../../components/coach/CoachBubble";
import { StreakWidget } from "../../components/coach/StreakWidget";
import { SectionLabel } from "../../components/redesign/SectionLabel";
import { Tag } from "../../components/redesign/Tag";
import {
  borderRadius,
  colors,
  hairline,
  spacing,
  typography,
} from "../../constants/ui";
import {
    getJoinedSessions,
    type JoinedSession,
} from "../../lib/joinedSessionsStore";
import { createApiClient, listSessions } from "../../lib/api";
import {
    getProfileSnapshot,
    type ReferencePaces,
    type RunnerProfile,
} from "../../lib/profileStore";
import {
    getRunTypePillLabel as getRunTypePillLabelFromModule,
    type RunTypeId,
} from "../../lib/runTypes";
import {
    getAllSessionsIncludingStored,
    apiSessionToSessionData,
    type SessionData,
} from "../../lib/sessionData";
import {
    applyFiltersAndSorting,
    getSessionDateForSort,
    getSessionRunTypeId,
} from "../../lib/sessionLogic";
import { isSessionVisibleToProfile } from "../../lib/sessionVisibility";
import { uniqueSessionBadges } from "../../lib/sessionBadges";
import { getRunTypePillLabel } from "../../lib/workoutHelpers";
import {
    getWorkout,
    type RunTypeId as WorkoutRunTypeId,
} from "../../lib/workoutStore";
import {
    buildCoachContext,
    computeAttendedStreakCount,
    getDailyCoachTake,
    streakMotivationMessage,
} from "../../lib/coach";
import {
    getLastCoachFeedback,
    type StoredCoachFeedback,
} from "../../lib/coachFeedbackStore";

function sumSessionParticipants(session: SessionData): number {
  return session.paceGroups.reduce(
    (sum, g) => sum + (g.runnersCount ?? 0),
    0,
  );
}

// Animated Session Card Component
type AnimatedSessionCardProps = {
  children: React.ReactNode;
  index: number;
  totalCount: number;
  hasAnimated: boolean;
  onAnimationComplete: () => void;
};

function AnimatedSessionCard({
  children,
  index,
  totalCount,
  hasAnimated,
  onAnimationComplete,
}: AnimatedSessionCardProps) {
  const cardOpacity = useRef(new Animated.Value(hasAnimated ? 1 : 0)).current;
  const cardTranslateY = useRef(
    new Animated.Value(hasAnimated ? 0 : 10),
  ).current;

  useEffect(() => {
    if (!hasAnimated) {
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 180,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 180,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (index === totalCount - 1) {
          onAnimationComplete();
        }
      });
    }
  }, [hasAnimated, index, totalCount, onAnimationComplete]);

  return (
    <Animated.View
      style={[
        styles.sessionCard,
        {
          opacity: cardOpacity,
          transform: [{ translateY: cardTranslateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export default function HomeScreen() {
  const [allSessions, setAllSessions] = useState<SessionData[]>([]);
  const [joined, setJoined] = useState<JoinedSession[]>([]);
  const [referencePaces, setReferencePaces] = useState<ReferencePaces | null>(
    null,
  );
  const [profile, setProfile] = useState<RunnerProfile | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [workoutRunTypes, setWorkoutRunTypes] = useState<
    Record<string, WorkoutRunTypeId>
  >({});
  const [coachFeedback, setCoachFeedback] = useState<StoredCoachFeedback | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadSessions = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
    // Load all sessions (seed + local) and merge API sessions (API wins on id collision)
    const [localSessions, apiSessions] = await Promise.all([
      getAllSessionsIncludingStored(),
      (async () => {
        try {
          const client = createApiClient();
          const apiResult = await listSessions(client);
          return (apiResult.sessions ?? []).map(apiSessionToSessionData);
        } catch (apiErr) {
          console.warn("API sessions list failed, using local only:", apiErr);
          return [] as SessionData[];
        }
      })(),
    ]);

    const sessionMap = new Map<string, SessionData>();
    localSessions.forEach((s) => sessionMap.set(s.id, s));
    apiSessions.forEach((s) => sessionMap.set(s.id, s));
    const sessions = Array.from(sessionMap.values());
    setAllSessions(sessions);

    // Load workout runTypes for sessions with workoutId
    const runTypeMap: Record<string, WorkoutRunTypeId> = {};
    await Promise.all(
      sessions
        .filter((s) => s.workoutId)
        .map(async (session) => {
          try {
            const workout = await getWorkout(session.workoutId!);
            if (workout?.runType) {
              runTypeMap[session.id] = workout.runType;
            }
          } catch {
            // Ignore errors - workout might not exist
          }
        }),
    );
    setWorkoutRunTypes(runTypeMap);

    // Load joined sessions to show "INSCRIT" pills
    try {
      const data = await getJoinedSessions();
      setJoined(data);
    } catch (e) {
      console.warn("Failed to load joined sessions for home:", e);
    }

    // Load profile snapshot for reference paces
    try {
      const snapshot = await getProfileSnapshot();
      setReferencePaces(snapshot.paces);
      setProfile(snapshot.profile ?? null);
      try {
        const fb = await getLastCoachFeedback();
        setCoachFeedback(fb);
      } catch {
        setCoachFeedback(null);
      }
    } catch (e) {
      console.warn("Failed to load reference paces:", e);
    }
  } finally {
    setIsLoading(false);
    setIsRefreshing(false);
  }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSessions();
    }, [loadSessions]),
  );

  const accessibleSessions = useMemo(() => {
    return allSessions.filter((session) =>
      isSessionVisibleToProfile(session, profile),
    );
  }, [allSessions, profile]);

  /** Home lists all accessible sessions (no filters on this screen). */
  const homeSessions = useMemo(
    () => applyFiltersAndSorting(accessibleSessions, {}, referencePaces),
    [accessibleSessions, referencePaces],
  );

  const insets = useSafeAreaInsets();
  const joinedIds = useMemo(
    () => new Set(joined.map((j) => j.sessionId)),
    [joined],
  );

  const nextHighlightSession = useMemo(() => {
    const now = Date.now();
    const grace = 15 * 60 * 1000;
    const list = [...homeSessions].sort(
      (a, b) => getSessionDateForSort(a) - getSessionDateForSort(b),
    );
    const joinedUpcoming = list.find(
      (s) =>
        joinedIds.has(s.id) && getSessionDateForSort(s) >= now - grace,
    );
    if (joinedUpcoming) return joinedUpcoming;
    return (
      list.find((s) => getSessionDateForSort(s) >= now - grace) ?? list[0]
    );
  }, [homeSessions, joinedIds]);

  const displayName =
    profile?.firstName?.trim() || profile?.name?.trim() || "Coureur";
  const initial = displayName.charAt(0).toUpperCase();

  const recGroup = nextHighlightSession
    ? nextHighlightSession.paceGroups.find(
        (g) => g.id === nextHighlightSession.recommendedGroupId,
      ) ?? nextHighlightSession.paceGroups[0]
    : null;

  const streakCount = useMemo(
    () => computeAttendedStreakCount(accessibleSessions, joinedIds),
    [accessibleSessions, joinedIds],
  );

  const weekSessions = useMemo(() => {
    const now = Date.now();
    const end = now + 7 * 86400000;
    const grace = 15 * 60 * 1000;
    return homeSessions
      .filter((s) => {
        const tt = getSessionDateForSort(s);
        return tt >= now - grace && tt <= end;
      })
      .map((s) => {
        const rt = s.workoutId ? workoutRunTypes[s.id] : null;
        return (rt ?? getSessionRunTypeId(s) ?? s.typeLabel) as string;
      })
      .filter(Boolean);
  }, [homeSessions, workoutRunTypes]);

  const nearbySessions = useMemo(() => {
    const nid = nextHighlightSession?.id;
    return homeSessions.filter((s) => s.id !== nid).slice(0, 3);
  }, [homeSessions, nextHighlightSession]);

  const dailyCoachContext = useMemo(() => {
    const sid = nextHighlightSession?.id;
    const sessionType = sid
      ? (workoutRunTypes[sid] ??
          getSessionRunTypeId(nextHighlightSession) ??
          nextHighlightSession.typeLabel)
      : undefined;
    return buildCoachContext({
      screen: "home",
      sessions: accessibleSessions,
      joinedIds,
      workoutRunTypes,
      feedback: coachFeedback,
      weekSessions,
      sessionType,
      sessionPace: nextHighlightSession?.targetPace,
      userGroup: recGroup?.id,
    });
  }, [
    accessibleSessions,
    joinedIds,
    workoutRunTypes,
    coachFeedback,
    weekSessions,
    nextHighlightSession,
    recGroup,
  ]);

  const dailyCoach = useMemo(
    () => getDailyCoachTake(dailyCoachContext),
    [dailyCoachContext],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 6 },
        ]}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadSessions(true)}
            tintColor={colors.text.accent}
          />
        }
      >
        {isLoading && allSessions.length === 0 ? (
          <LoadingState message="Chargement des séances…" />
        ) : null}
        <View style={styles.homeIntro}>
          <View style={styles.toprow}>
            <View>
              <Text style={styles.pgName}>{`Bonjour ${displayName}`}</Text>
            </View>
            <View style={styles.topIcons}>
              <Pressable
                style={styles.iconButton}
                onPress={() => router.push("/inbox" as Href)}
              >
                <Svg width={16} height={16} viewBox="0 0 20 20" fill="none">
                  <Path
                    d="M4 5h12M4 10h8M4 15h10"
                    stroke={colors.text.secondary}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                </Svg>
              </Pressable>
              <Pressable
                style={styles.avatarRing}
                onPress={() => router.push("/(tabs)/profile")}
                accessibilityRole="button"
                accessibilityLabel="Ouvrir le profil"
              >
                <Text style={styles.avatarTxt}>{initial}</Text>
              </Pressable>
            </View>
          </View>

          <StreakWidget
            streakCount={streakCount}
            caption={streakMotivationMessage(streakCount)}
            week={["on", "on", "off", "on", "on", "off", "today"]}
          />

          <CoachBubble
            coachName={
              nextHighlightSession?.coachName
                ? `Coach ${nextHighlightSession.coachName}`
                : "Coach GRPD"
            }
            title={dailyCoach.title}
            context="Conseil du jour"
            message={dailyCoach.message}
          />

          {nextHighlightSession ? (
            <Pressable
              onPress={() =>
                router.push(`/session/${nextHighlightSession.id}`)
              }
            >
              <View style={styles.nextHeroCard}>
                <Text style={styles.nextKicker}>PROCHAINE SÉANCE</Text>
                <View style={styles.nextRow}>
                  <View style={styles.nextLeft}>
                    <Text style={styles.nextTitle}>
                      {nextHighlightSession.title}
                    </Text>
                    <Text style={styles.nextMeta}>
                      {nextHighlightSession.dateLabel} ·{" "}
                      {nextHighlightSession.spot} ·{" "}
                      {nextHighlightSession.estimatedDistanceKm} km
                    </Text>
                    <View style={styles.tagRow}>
                      {nextHighlightSession.visibility !== "members" && (
                        <Tag label="Découverte" variant="tp" />
                      )}
                      {nextHighlightSession.genderRestriction ===
                        "women_only" && (
                        <Tag label="100% Femmes" variant="tpk" />
                      )}
                      {nextHighlightSession.visibility === "members" && (
                        <Tag label="Membres" variant="tgr" />
                      )}
                    </View>
                  </View>
                  {recGroup ? (
                    <View style={styles.nextRight}>
                      <Text style={styles.nextGLabel}>Groupe {recGroup.id}</Text>
                      <Text style={styles.nextPaceHero}>
                        {recGroup.paceRange}
                      </Text>
                      <Text style={styles.nextPaceUnit}>/km</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.nextFooter}>
                  <View style={styles.nextAvatarStack}>
                    {[0, 1, 2].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.nextAvatarDisc,
                          { marginLeft: i === 0 ? 0 : -12 },
                          {
                            backgroundColor: ["#5B8DEF", "#4DD990", "#A87BF8"][
                              i
                            ],
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.nextStatus}>
                    {joinedIds.has(nextHighlightSession.id)
                      ? `Inscrite · Groupe ${recGroup?.id ?? "?"}`
                      : "À découvrir"}
                  </Text>
                </View>
              </View>
            </Pressable>
          ) : null}
        </View>

        <SectionLabel>Séances près de toi</SectionLabel>

        {!isLoading && nearbySessions.length === 0 ? (
          <Text style={styles.nearbyEmpty}>
            Aucune autre séance à proximité pour le moment. Tire pour rafraîchir.
          </Text>
        ) : null}

        <View style={[styles.sessionsList, { marginTop: 16 }]}>
            {nearbySessions.map((session, index) => {
              const joinedSet = new Set(joined.map((j) => j.sessionId));
              const isJoined = joinedSet.has(session.id);
              const isCustom = session.isCustom === true;
              const participants = sumSessionParticipants(session);

              const workoutRunType = session.workoutId
                ? workoutRunTypes[session.id]
                : null;
              const sessionTypeId =
                workoutRunType || getSessionRunTypeId(session);
              const typePillLabel = workoutRunType
                ? getRunTypePillLabel(workoutRunType)
                : sessionTypeId
                  ? getRunTypePillLabelFromModule(sessionTypeId as RunTypeId)
                  : "PERSONNALISÉ";

              const extraBadges = uniqueSessionBadges([
                ...(session.visibility === "members"
                  ? [{ label: "🔒 MEMBRES", variant: "custom" as const }]
                  : []),
                ...(isCustom
                  ? [{ label: "Créée par toi", variant: "success" as const }]
                  : []),
                ...(isJoined
                  ? [{ label: "INSCRIT", variant: "active" as const }]
                  : []),
              ]);

              return (
                <AnimatedSessionCard
                  key={session.id}
                  index={index}
                  totalCount={nearbySessions.length}
                  hasAnimated={hasAnimated}
                  onAnimationComplete={() => {
                    if (index === nearbySessions.length - 1) {
                      setHasAnimated(true);
                    }
                  }}
                >
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/session/${session.id}`);
                    }}
                    accessibilityRole="button"
                  >
                    <Card style={styles.nearbyCard}>
                      <View style={styles.nearbyTopRow}>
                        <View style={styles.nearbyPillsWrap}>
                          <Tag label={typePillLabel} variant="tb" />
                          {participants > 0 ? (
                            <Chip
                              label={`${participants} PARTICIPANTS`}
                              variant="custom"
                            />
                          ) : null}
                          {session.hostGroupName ? (
                            <Chip
                              label={session.hostGroupName.toUpperCase()}
                              variant="default"
                              style={styles.hostGroupChip}
                              textStyle={styles.hostGroupChipText}
                            />
                          ) : session.visibility === "members" ? (
                            <Chip
                              label="ÉQUIPE"
                              variant="default"
                              style={styles.hostGroupChip}
                              textStyle={styles.hostGroupChipText}
                            />
                          ) : null}
                          {extraBadges.map((badge) => (
                            <Chip
                              key={`${session.id}-${badge.variant}-${badge.label}`}
                              label={badge.label}
                              variant={badge.variant}
                            />
                          ))}
                        </View>
                        {/*
                          Geo distance (e.g. 0.8 km) requires user location or API;
                          placeholder until wired — do not use estimatedDistanceKm (course length).
                        */}
                        <Text style={styles.nearbyDistance}>—</Text>
                      </View>
                      <Text style={styles.nearbyTitle}>{session.title}</Text>
                      <Text style={styles.nearbyMeta}>
                        {session.dateLabel} · {session.spot} ·{" "}
                        {session.targetPace}
                      </Text>
                    </Card>
                  </Pressable>
                </AnimatedSessionCard>
              );
            })}
        </View>
      </ScrollView>

    </View>
  );
}

type HomeStyles = {
  container: ViewStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  homeIntro: ViewStyle;
  toprow: ViewStyle;
  bonjour: TextStyle;
  pgName: TextStyle;
  topIcons: ViewStyle;
  iconButton: ViewStyle;
  avatarRing: ViewStyle;
  avatarTxt: TextStyle;
  nextKicker: TextStyle;
  nextRow: ViewStyle;
  nextLeft: ViewStyle;
  nextTitle: TextStyle;
  nextMeta: TextStyle;
  tagRow: ViewStyle;
  nextRight: ViewStyle;
  nextGLabel: TextStyle;
  nextPaceHero: TextStyle;
  nextPaceUnit: TextStyle;
  nextFooter: ViewStyle;
  nextStatus: TextStyle;
  nextHeroCard: ViewStyle;
  nextAvatarStack: ViewStyle;
  nextAvatarDisc: ViewStyle;
  nearbyEmpty: TextStyle;
  sessionsList: ViewStyle;
  sessionCard: ViewStyle;
  nearbyCard: ViewStyle;
  nearbyTopRow: ViewStyle;
  nearbyPillsWrap: ViewStyle;
  nearbyTitle: TextStyle;
  nearbyMeta: TextStyle;
  nearbyDistance: TextStyle;
  hostGroupChip: ViewStyle;
  hostGroupChipText: TextStyle;
};

const styles = StyleSheet.create<HomeStyles>({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 32,
  },
  homeIntro: {
    marginBottom: 4,
  },
  toprow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  bonjour: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  pgName: {
    fontSize: typography.sizes["3xl"],
    fontWeight: "700",
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  topIcons: { flexDirection: "row", alignItems: "center", gap: 7 },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface.s3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primaryDim,
    borderWidth: 1.5,
    borderColor: colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: {
    fontWeight: "700",
    fontSize: typography.sizes.md,
    color: colors.text.accent,
  },
  nextKicker: {
    fontSize: typography.sizes.xs,
    color: colors.accent.primary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  nextHeroCard: {
    backgroundColor: colors.accent.primaryDim,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.accent.primaryMid,
    paddingHorizontal: 13,
    paddingVertical: 13,
    marginBottom: 9,
  },
  nextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nextLeft: { flex: 1, paddingRight: 8 },
  nextTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 2,
  },
  nextMeta: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 7 },
  nextRight: { alignItems: "flex-end" },
  nextGLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  nextPaceHero: {
    fontSize: typography.sizes["2xl"],
    fontWeight: "700",
    color: colors.text.accent,
    letterSpacing: -0.5,
  },
  nextPaceUnit: {
    fontSize: 9,
    color: colors.text.secondary,
  },
  nextFooter: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nextAvatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  nextAvatarDisc: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  nextStatus: {
    fontSize: typography.sizes.md,
    color: colors.text.success,
    fontWeight: "600",
  },
  nearbyEmpty: {
    marginTop: 12,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  sessionsList: {
    marginTop: 8,
  },
  sessionCard: {
    marginBottom: spacing.md,
  },
  nearbyCard: {
    marginBottom: spacing.sm,
  },
  nearbyTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  nearbyPillsWrap: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  nearbyTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.title,
    fontWeight: "700",
    marginBottom: 4,
  },
  nearbyMeta: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: 18,
  },
  nearbyDistance: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: "600",
    marginLeft: 4,
  },
  hostGroupChip: {
    borderColor: colors.tag.greenText,
    backgroundColor: "transparent",
  },
  hostGroupChipText: {
    color: colors.tag.greenText,
    fontWeight: "600",
    fontSize: 10,
  },
});
