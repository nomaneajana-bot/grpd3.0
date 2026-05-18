import { router, useFocusEffect } from "expo-router";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Animated,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import * as Haptics from "expo-haptics";

import { SearchField } from "../../components/redesign/SearchField";
import { Tag } from "../../components/redesign/Tag";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";
import { LoadingState } from "../../components/ui/LoadingState";
import { CoachWeeklyPlan } from "../../components/coach/CoachWeeklyPlan";
import { borderRadius, colors, hairline, typography } from "../../constants/ui";
import { createApiClient, getMySessions } from "../../lib/api";
import {
    getJoinedSessions,
    type JoinedSession,
} from "../../lib/joinedSessionsStore";
import { getStoredRuns, type StoredRun } from "../../lib/runStore";
import {
    getRunTypePillLabel as getRunTypePillLabelFromModule,
    type RunTypeId as RunTypeIdFromRunTypes,
} from "../../lib/runTypes";
import {
    getAllSessionsIncludingStored,
    apiSessionToSessionData,
    type SessionData,
} from "../../lib/sessionData";
import { uniqueSessionBadges } from "../../lib/sessionBadges";
import {
    filterSessionsList,
    type SessionFilterChipId,
} from "../../lib/sessionListFilters";
import {
    getSessionDateForSort,
    getSessionRunTypeId,
} from "../../lib/sessionLogic";
import { buildCoachContext } from "../../lib/coach";
import { getRunTypePillLabel } from "../../lib/workoutHelpers";
import { getWorkout, type RunTypeId } from "../../lib/workoutStore";

// Animated Session Card Component for Timeline
type AnimatedTimelineCardProps = {
  children: React.ReactNode;
  index: number;
  totalCount: number;
  hasAnimated: boolean;
  onAnimationComplete: () => void;
};

function AnimatedTimelineCard({
  children,
  index,
  totalCount,
  hasAnimated,
  onAnimationComplete,
}: AnimatedTimelineCardProps) {
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
  }, [
    hasAnimated,
    index,
    totalCount,
    onAnimationComplete,
    cardOpacity,
    cardTranslateY,
  ]);

  return (
    <Animated.View
      style={[
        styles.sessionCardAnimatedWrap,
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

// Run type logic moved to lib/runTypes.ts and lib/sessionLogic.ts

function formatSessionDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km <= 0) return "—";
  const s = km < 10 ? km.toFixed(1) : String(Math.round(km));
  return `${s}km`;
}

function sumSessionParticipants(session: SessionData): number {
  return session.paceGroups.reduce(
    (sum, g) => sum + (g.runnersCount ?? 0),
    0,
  );
}

/** Top line like "MARDI 5 MAI · 18:00 · Parc …" (screenshot). */
function formatSessionMetaUpper(session: SessionData): string {
  const spot = (session.spot || "").trim();
  let datePart = (session.dateLabel || "").toUpperCase();
  if (session.dateISO) {
    const d = new Date(`${session.dateISO}T12:00:00`);
    const wd = d.toLocaleDateString("fr-FR", { weekday: "long" });
    const dm = d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
    });
    datePart = `${wd} ${dm}`.toUpperCase();
  }
  const tm = session.timeMinutes;
  const timeStr =
    tm != null && Number.isFinite(tm)
      ? `${Math.floor(tm / 60)}:${String(tm % 60).padStart(2, "0")}`
      : "";
  if (timeStr && spot) return `${datePart} · ${timeStr} · ${spot}`;
  if (spot) return `${datePart} · ${spot}`;
  return datePart;
}

function tagVariantForRunPill(label: string): "tb" | "tg" | "to" | "tp" | "tpk" | "tgr" {
  const u = label.toUpperCase();
  if (u.includes("PROGRESSIF") || u.includes("TEMPO") || u.includes("FARTLEK"))
    return "tb";
  if (u.includes("DÉCOUVERTE") || u.includes("DECOUVERTE")) return "tp";
  if (u.includes("FEMMES")) return "tpk";
  if (u.includes("MARCHE") || u.includes("FOOTING")) return "tg";
  return "tb";
}

export default function MySessionsScreen() {
  const [allSessions, setAllSessions] = useState<SessionData[]>([]);
  const [joinedSessions, setJoinedSessions] = useState<JoinedSession[]>([]);
  const [storedRuns, setStoredRuns] = useState<StoredRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [workoutRunTypes, setWorkoutRunTypes] = useState<
    Record<string, RunTypeId>
  >({});
  const insets = useSafeAreaInsets();
  /** Matches tab bar height in `(tabs)/_layout.tsx` + small buffer. */
  const tabBarInset = 56 + Math.max(insets.bottom, 10) + 10;
  const scrollBottomPadding = tabBarInset + 16;
  const [sessionSearch, setSessionSearch] = useState("");
  const [chipType, setChipType] = useState<SessionFilterChipId>("all");

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      let sessions: SessionData[] = await getAllSessionsIncludingStored();
      try {
        const client = createApiClient();
        const apiResult = await getMySessions(client);
        const apiSessions = (apiResult.sessions ?? []).map(apiSessionToSessionData);
        const localIds = new Set(sessions.map((s) => s.id));
        for (const apiSession of apiSessions) {
          if (!localIds.has(apiSession.id)) {
            sessions = [...sessions, apiSession];
            localIds.add(apiSession.id);
          }
        }
      } catch (apiErr) {
        console.warn("API my-sessions failed, using local only:", apiErr);
      }
      setAllSessions(sessions);

      const runTypeMap: Record<string, RunTypeId> = {};
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
              // ignore
            }
          }),
      );
      setWorkoutRunTypes(runTypeMap);

      const joined = await getJoinedSessions();
      setJoinedSessions(joined);

      const runs = await getStoredRuns();
      setStoredRuns(runs);
    } catch (error) {
      console.warn("Failed to load sessions data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  // Build joined set for quick lookup
  const joinedSet = useMemo(() => {
    return new Set(joinedSessions.map((js) => js.sessionId));
  }, [joinedSessions]);

  const attendanceStatusBySessionId = useMemo(() => {
    const map = new Map<string, SessionData["attendanceStatus"]>();
    for (const session of allSessions) {
      if (session.attendanceStatus) {
        map.set(session.id, session.attendanceStatus);
      }
    }
    return map;
  }, [allSessions]);

  // Filter to only show sessions created by me OR sessions I am involved in
  // Sort by date ascending
  const mySessions = useMemo(() => {
    const personalSessions = allSessions.filter(
      (session) =>
        session.isCustom === true ||
        joinedSet.has(session.id) ||
        session.attendanceStatus === "suggested" ||
        session.attendanceStatus === "requested" ||
        session.attendanceStatus === "joined",
    );

    // Sort by date ascending
    return [...personalSessions].sort((a, b) => {
      return getSessionDateForSort(a) - getSessionDateForSort(b);
    });
  }, [allSessions, joinedSet]);

  const pastCutoffMs = Date.now() - 15 * 60 * 1000; // 15 min grace after start time

  const upcomingSessions = useMemo(() => {
    return mySessions.filter(
      (session) => getSessionDateForSort(session) >= pastCutoffMs,
    );
  }, [mySessions, pastCutoffMs]);

  const pastSessions = useMemo(() => {
    return [...mySessions]
      .filter((session) => getSessionDateForSort(session) < pastCutoffMs)
      .sort(
        (a, b) => getSessionDateForSort(b) - getSessionDateForSort(a),
      );
  }, [mySessions, pastCutoffMs]);

  const sessionChips = useMemo(
    () => [
      { id: "all" as const, label: "Tout" },
      { id: "fartlek" as const, label: "Fartlek" },
      { id: "tempo_run" as const, label: "Tempo" },
      { id: "discovery_run" as const, label: "Découverte" },
      { id: "easy_run" as const, label: "Footing" },
      { id: "series" as const, label: "Séries" },
      { id: "progressif" as const, label: "Progressif" },
    ],
    [],
  );

  const filteredUpcoming = useMemo(
    () =>
      filterSessionsList(
        upcomingSessions,
        chipType,
        sessionSearch,
        workoutRunTypes,
      ),
    [upcomingSessions, chipType, sessionSearch, workoutRunTypes],
  );

  const filteredPastSessions = useMemo(
    () =>
      filterSessionsList(
        pastSessions,
        chipType,
        sessionSearch,
        workoutRunTypes,
      ),
    [pastSessions, chipType, sessionSearch, workoutRunTypes],
  );

  const coachMySessionsWeekLabels = useMemo(() => {
    return filteredUpcoming
      .map((s) => {
        const rt = s.workoutId ? workoutRunTypes[s.id] : null;
        return (rt ?? getSessionRunTypeId(s) ?? s.typeLabel) as string;
      })
      .filter(Boolean);
  }, [filteredUpcoming, workoutRunTypes]);

  const coachWeeklyContext = useMemo(
    () =>
      buildCoachContext({
        screen: "my_sessions",
        sessions: allSessions,
        joinedIds: joinedSet,
        workoutRunTypes,
        weekSessions: coachMySessionsWeekLabels,
      }),
    [allSessions, joinedSet, workoutRunTypes, coachMySessionsWeekLabels],
  );

  const joinedRuns = useMemo(() => {
    const now = Date.now();
    return [...storedRuns]
      .filter((entry) => entry.isJoined)
      .filter((entry) => {
        const start = new Date(entry.run.startTimeISO).getTime();
        return Number.isFinite(start) && start >= now;
      })
      .sort(
        (a, b) =>
          new Date(a.run.startTimeISO).getTime() -
          new Date(b.run.startTimeISO).getTime(),
      );
  }, [storedRuns]);

  const pastRuns = useMemo(() => {
    const now = Date.now();
    return [...storedRuns]
      .filter((entry) => entry.isJoined)
      .filter((entry) => {
        const start = new Date(entry.run.startTimeISO).getTime();
        return Number.isFinite(start) && start < now;
      })
      .sort(
        (a, b) =>
          new Date(b.run.startTimeISO).getTime() -
          new Date(a.run.startTimeISO).getTime(),
      );
  }, [storedRuns]);

  const formatRunDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const formatPace = (pace: number) => {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}'${seconds.toString().padStart(2, "0")}/km`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 6,
            paddingBottom: scrollBottomPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
            tintColor={colors.text.accent}
          />
        }
      >
        {isLoading && allSessions.length === 0 ? (
          <LoadingState message="Chargement de tes séances…" />
        ) : null}
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Mes séances</Text>
              <Text style={styles.headerSubtitle}>
                Ton agenda de séances.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/session/create")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.createPill}
              activeOpacity={0.85}
            >
              <Text style={styles.createPillText}>Créer</Text>
            </TouchableOpacity>
          </View>
        </View>

        <SearchField
          value={sessionSearch}
          onChangeText={setSessionSearch}
          placeholder="Rechercher…"
          style={styles.searchFieldWrap}
        />

        <View style={styles.chipsRow}>
          {sessionChips.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setChipType(c.id)}
              activeOpacity={0.85}
            >
              <Chip
                label={c.label}
                variant="default"
                style={[
                  styles.filterChip,
                  chipType === c.id &&
                    (c.id === "all"
                      ? styles.filterChipActiveAll
                      : styles.filterChipActive),
                ]}
                textStyle={[
                  styles.filterChipText,
                  chipType === c.id &&
                    (c.id === "all"
                      ? styles.filterChipTextActiveAll
                      : styles.filterChipTextActive),
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {joinedRuns.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Courses à venir</Text>
            {joinedRuns.map((entry) => (
              <Card key={entry.run.id} style={styles.sessionCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderTopRow}>
                    <Text style={styles.spotName} numberOfLines={1}>
                      {entry.run.location.placeName || "Course"}
                    </Text>
                    <Text style={styles.dateText}>
                      {formatRunDate(entry.run.startTimeISO)}
                    </Text>
                  </View>
                  <View style={styles.pillsContainer}>
                    <Chip label="RUN" variant="default" />
                    <Chip label="INSCRIT" variant="active" />
                  </View>
                </View>
                <Text style={styles.title}>{entry.run.runType}</Text>
                <Text style={styles.description}>
                  {entry.run.distanceKm} km · {formatPace(entry.run.paceMinPerKm)}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/run/confirm",
                      params: {
                        runId: entry.run.id,
                        status: entry.status,
                        participants: JSON.stringify(entry.participants || []),
                      },
                    })
                  }
                  style={styles.detailsButton}
                >
                  <Text style={styles.detailsButtonText}>→ Voir détails</Text>
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        )}

        {pastRuns.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Courses passées</Text>
            {pastRuns.map((entry) => (
              <Card key={entry.run.id} style={styles.sessionCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderTopRow}>
                    <Text style={styles.spotName} numberOfLines={1}>
                      {entry.run.location.placeName || "Course"}
                    </Text>
                    <Text style={styles.dateText}>
                      {formatRunDate(entry.run.startTimeISO)}
                    </Text>
                  </View>
                  <View style={styles.pillsContainer}>
                    <Chip label="RUN" variant="default" />
                    <Chip label="PASSÉE" variant="custom" />
                  </View>
                </View>
                <Text style={styles.title}>{entry.run.runType}</Text>
                <Text style={styles.description}>
                  {entry.run.distanceKm} km · {formatPace(entry.run.paceMinPerKm)}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/run/confirm",
                      params: {
                        runId: entry.run.id,
                        status: entry.status,
                        participants: JSON.stringify(entry.participants || []),
                      },
                    })
                  }
                  style={styles.detailsButton}
                >
                  <Text style={styles.detailsButtonText}>→ Voir détails</Text>
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!isLoading &&
          upcomingSessions.length === 0 &&
          pastSessions.length === 0 &&
          joinedRuns.length === 0 &&
          pastRuns.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateEmoji}>😕</Text>
            <Text style={styles.emptyStateTitle}>
              Rien de prévu — rejoins une séance ou crée-en une.
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              Utilise Créer ci-dessus ou rejoins une séance depuis l&apos;accueil.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateSecondaryButton}
              onPress={() => router.push("/")}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyStateSecondaryButtonText}>
                Parcourir les séances
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sessions List */}
        {!isLoading && upcomingSessions.length > 0 && (
          <View style={styles.sessionsList}>
            <Text style={styles.sectionTitle}>À VENIR</Text>
            {filteredUpcoming.length === 0 && (
              <Text style={styles.filterEmpty}>
                Aucune séance ne correspond à ta recherche.
              </Text>
            )}

            <View style={styles.sessionsStack}>
              {filteredUpcoming.map((session, index) => {
                const description = `${session.volume} · ${session.targetPace}`;
                const isJoined = joinedSet.has(session.id);
                const isCustom = session.isCustom === true;
                const attendanceStatus =
                  attendanceStatusBySessionId.get(session.id) ??
                  (isJoined ? "joined" : null);

                const workoutRunType = session.workoutId
                  ? workoutRunTypes[session.id]
                  : null;
                const sessionTypeId =
                  workoutRunType || getSessionRunTypeId(session);
                const typeLabel = workoutRunType
                  ? getRunTypePillLabel(workoutRunType)
                  : sessionTypeId
                    ? getRunTypePillLabelFromModule(
                        sessionTypeId as RunTypeIdFromRunTypes,
                      )
                    : "PERSONNALISÉ";
                const badges = uniqueSessionBadges([
                  ...(typeLabel
                    ? [{ label: typeLabel, variant: "default" as const }]
                    : []),
                  ...(session.visibility === "members"
                    ? [{ label: "🔒 MEMBRES", variant: "custom" as const }]
                    : []),
                  ...(isCustom
                    ? [{ label: "Créée par toi", variant: "success" as const }]
                    : []),
                  ...(isJoined
                    ? [{ label: "INSCRIT", variant: "active" as const }]
                    : []),
                  ...(attendanceStatus === "requested"
                    ? [{ label: "DEMANDE", variant: "custom" as const }]
                    : []),
                  ...(attendanceStatus === "suggested"
                    ? [{ label: "SUGGÉRÉ", variant: "custom" as const }]
                    : []),
                ]);
                const [typeBadge, ...restBadges] = badges;
                const n = sumSessionParticipants(session);

                return (
                  <React.Fragment key={session.id}>
                  <AnimatedTimelineCard
                    index={index}
                    totalCount={filteredUpcoming.length}
                    hasAnimated={hasAnimated}
                    onAnimationComplete={() => {
                      if (index === filteredUpcoming.length - 1) {
                        setHasAnimated(true);
                      }
                    }}
                  >
                    <Card style={styles.upcomingSessionCard}>
                      <View style={styles.sessionMetaRow}>
                        <Text
                          style={styles.sessionMetaText}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {formatSessionMetaUpper(session)}
                        </Text>
                        <Text style={styles.sessionDistance}>
                          {formatSessionDistanceKm(session.estimatedDistanceKm)}
                        </Text>
                      </View>

                      <View style={styles.sessionTagRow}>
                        {typeBadge ? (
                          <Tag
                            label={typeBadge.label}
                            variant={tagVariantForRunPill(typeBadge.label)}
                            style={styles.sessionTypeTag}
                          />
                        ) : null}
                        {restBadges.map((badge) => (
                          <Chip
                            key={`${session.id}-${badge.variant}-${badge.label}`}
                            label={badge.label}
                            variant="default"
                            style={styles.sessionMetaChip}
                            textStyle={styles.sessionMetaChipText}
                          />
                        ))}
                      </View>

                      <Text style={styles.sessionCardTitle} numberOfLines={2}>
                        {session.title}
                      </Text>
                      <Text style={styles.sessionCardDescription} numberOfLines={2}>
                        {description}
                      </Text>

                      <View style={styles.sessionCardFooter}>
                        <Text style={styles.sessionParticipants}>
                          {n}{" "}
                          {n <= 1 ? "participant" : "participants"}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light,
                            );
                            router.push(`/session/${session.id}`);
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.sessionDetailsLink}>
                            Voir détails →
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </Card>
                  </AnimatedTimelineCard>
                  {index === 0 ? (
                    <CoachWeeklyPlan
                      context={coachWeeklyContext}
                      sessions={allSessions}
                      joinedIds={joinedSet}
                      workoutRunTypes={workoutRunTypes}
                    />
                  ) : null}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        )}

        {!isLoading && pastSessions.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>HISTORIQUE</Text>
            {filteredPastSessions.length === 0 && (
              <Text style={styles.filterEmpty}>
                Aucune séance passée ne correspond à ta recherche.
              </Text>
            )}
            {filteredPastSessions.map((session) => {
              const description = `${session.volume} · ${session.targetPace}`;

              const workoutRunType = session.workoutId
                ? workoutRunTypes[session.id]
                : null;
              const sessionTypeId =
                workoutRunType || getSessionRunTypeId(session);
              const typeLabel = workoutRunType
                ? getRunTypePillLabel(workoutRunType)
                : sessionTypeId
                  ? getRunTypePillLabelFromModule(
                      sessionTypeId as RunTypeIdFromRunTypes,
                    )
                  : "PERSONNALISÉ";

              return (
                <Card key={session.id} style={styles.historyCard}>
                  <View style={styles.historyTopRow}>
                    <View style={styles.historyMeta}>
                      <Text style={styles.historyType} numberOfLines={1}>
                        {typeLabel}
                        {session.spot ? ` · ${session.spot}` : ""}
                      </Text>
                      <Text style={styles.historySub} numberOfLines={1}>
                        {session.dateLabel} · {session.targetPace}
                        {session.volume ? ` · ${session.volume}` : ""}
                      </Text>
                    </View>
                    <Text style={styles.historyDone}>TERMINÉ</Text>
                  </View>
                  <Text style={styles.title}>{session.title}</Text>
                  <Text style={styles.description}>{description}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/session/${session.id}`);
                    }}
                    style={styles.detailsButton}
                  >
                    <Text style={styles.detailsButtonText}>
                      → Voir détails
                    </Text>
                  </TouchableOpacity>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    backgroundColor: colors.background.primary,
    position: "relative",
  },
  scrollView: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingHorizontal: 14,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 12,
    alignItems: "center",
  },
  searchFieldWrap: {
    marginTop: 4,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    minHeight: 32,
    justifyContent: "center",
    backgroundColor: "transparent",
    borderColor: "rgba(255,255,255,0.14)",
    borderWidth: hairline,
  },
  filterChipActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  filterChipActiveAll: {
    backgroundColor: "transparent",
    borderColor: "rgba(255,255,255,0.85)",
    borderWidth: 1.5,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  filterChipTextActiveAll: {
    color: "#fff",
    fontWeight: "600",
  },
  filterEmpty: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    marginBottom: 12,
  },
  header: {
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes["3xl"],
    fontWeight: "800",
    marginBottom: 2,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: "400",
    opacity: 0.9,
  },
  createPill: {
    borderRadius: borderRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.accent.primary,
    borderWidth: 0,
  },
  createPillText: {
    color: "#fff",
    fontSize: typography.sizes.sm,
    fontWeight: "700",
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#BFBFBF",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sessionsList: {
    position: "relative",
  },
  sessionsStack: {
    gap: 0,
  },
  sessionCardAnimatedWrap: {
    marginBottom: 12,
  },
  upcomingSessionCard: {
    backgroundColor: "#131313",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    marginBottom: 0,
  },
  sessionMetaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  sessionMetaText: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  sessionDistance: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 0,
  },
  sessionTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
    marginBottom: 10,
  },
  sessionTypeTag: {
    marginRight: 0,
  },
  sessionMetaChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: hairline,
  },
  sessionMetaChipText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.text.secondary,
    textTransform: "uppercase",
  },
  sessionCardTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
    lineHeight: 20,
  },
  sessionCardDescription: {
    color: "#BFBFBF",
    fontSize: 13,
    lineHeight: 18,
  },
  sessionCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  sessionParticipants: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "500",
  },
  sessionDetailsLink: {
    color: colors.accent.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  sessionCard: {
    backgroundColor: "#131313",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    marginBottom: 16,
  },
  historyCard: {
    backgroundColor: "#131313",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    marginBottom: 12,
  },
  historyTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  historyMeta: { flex: 1 },
  historyType: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: "700",
    marginBottom: 4,
  },
  historySub: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  historyDone: {
    color: colors.tag.greenText,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    flexShrink: 0,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardHeaderTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#1A2230",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  typePillText: {
    color: "#BFBFBF",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  customPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#1A2230",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  customPillText: {
    color: "#BFBFBF",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  spotName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
    marginRight: 12,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(41, 208, 126, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(41, 208, 126, 0.6)",
  },
  statusPillText: {
    color: "#29D07E",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  date: {
    color: "#F8B319",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    flexShrink: 0,
  },
  dateText: {
    color: "#BFBFBF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    flexShrink: 0,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  description: {
    color: "#BFBFBF",
    fontSize: 14,
    marginBottom: 8,
  },
  detailsButton: {
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  detailsButtonText: {
    color: colors.accent.primary,
    fontSize: typography.sizes.md,
    fontWeight: "600",
  },
  // Empty state styles (matching index.tsx)
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    marginTop: 40,
  },
  emptyStateEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyStateTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    color: "#BFBFBF",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateSecondaryButton: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: "center",
    alignSelf: "stretch",
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  emptyStateSecondaryButtonText: {
    color: "#BFBFBF",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});
