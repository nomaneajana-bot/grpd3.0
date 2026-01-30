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
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import * as Haptics from "expo-haptics";

import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";
import { getStoredRuns, type StoredRun } from "../../lib/runStore";
import {
    getJoinedSessions,
    type JoinedSession,
} from "../../lib/joinedSessionsStore";
import { getRunTypePillLabel as getRunTypePillLabelFromModule } from "../../lib/runTypes";
import {
    getAllSessionsIncludingStored,
    type SessionData,
} from "../../lib/sessionData";
import {
    getSessionDateForSort,
    getSessionRunTypeId,
} from "../../lib/sessionLogic";
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
        styles.sessionCardWithTimeline,
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

export default function MySessionsScreen() {
  const [allSessions, setAllSessions] = useState<SessionData[]>([]);
  const [joinedSessions, setJoinedSessions] = useState<JoinedSession[]>([]);
  const [storedRuns, setStoredRuns] = useState<StoredRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [workoutRunTypes, setWorkoutRunTypes] = useState<
    Record<string, RunTypeId>
  >({});
  const scrollY = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load all sessions (including stored user sessions)
      const sessions = await getAllSessionsIncludingStored();
      setAllSessions(sessions);

      // Load workout runTypes for sessions with workoutId
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
              // Ignore errors - workout might not exist
            }
          }),
      );
      setWorkoutRunTypes(runTypeMap);

      // Load joined sessions
      const joined = await getJoinedSessions();
      setJoinedSessions(joined);

      // Load stored runs
      const runs = await getStoredRuns();
      setStoredRuns(runs);
    } catch (error) {
      console.warn("Failed to load sessions data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // Build joined set for quick lookup
  const joinedSet = useMemo(() => {
    return new Set(joinedSessions.map((js) => js.sessionId));
  }, [joinedSessions]);

  // Filter to only show sessions created by me OR sessions I've joined
  // Sort by date ascending
  const mySessions = useMemo(() => {
    const personalSessions = allSessions.filter(
      (session) => session.isCustom === true || joinedSet.has(session.id),
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

  // Animate header "Créer" opacity based on scroll
  const headerActionOpacity = scrollY.interpolate({
    inputRange: [0, 8, 32],
    outputRange: [1, 1, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Mes séances</Text>
              <Text style={styles.headerSubtitle}>Ton agenda de séances.</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/session/create")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Animated.Text
                style={[styles.headerAction, { opacity: headerActionOpacity }]}
              >
                Créer
              </Animated.Text>
            </TouchableOpacity>
          </View>
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
              Crée ta première séance depuis l'onglet Home.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateSecondaryButton}
              onPress={() => router.push("/")}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyStateSecondaryButtonText}>
                Aller à Home
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sessions List */}
        {!isLoading && upcomingSessions.length > 0 && (
          <View style={styles.sessionsList}>
            {/* "À venir" section label */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>À venir</Text>
              <View style={styles.sectionDivider} />
            </View>

            {/* Timeline container */}
            <View style={styles.timelineContainer}>
              <View style={styles.timelineLine} />
              {upcomingSessions.map((session, index) => {
                const description = `${session.volume} · ${session.targetPace}`;
                const isJoined = joinedSet.has(session.id);
                const isCustom = session.isCustom === true;

                // Determine if this is the next upcoming session
                const isNextUpcoming = index === 0; // First session in sorted list is nearest future

                return (
                  <AnimatedTimelineCard
                    key={session.id}
                    index={index}
                    totalCount={upcomingSessions.length}
                    hasAnimated={hasAnimated}
                    onAnimationComplete={() => {
                      if (index === upcomingSessions.length - 1) {
                        setHasAnimated(true);
                      }
                    }}
                  >
                    {/* Timeline dot */}
                    <View
                      style={[
                        styles.timelineDot,
                        isNextUpcoming && styles.timelineDotActive,
                      ]}
                    />

                    <Card style={styles.sessionCard}>
                      <View style={styles.cardHeader}>
                        {/* Row 1: Spot + Date */}
                        <View style={styles.cardHeaderTopRow}>
                          <Text
                            style={styles.spotName}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {session.spot}
                          </Text>
                          <Text
                            style={styles.date}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {session.dateLabel}
                          </Text>
                        </View>
                        {/* Row 2: Pills */}
                        <View style={styles.pillsContainer}>
                          {/* Type pill - prefer workout runType, fallback to typeLabel */}
                          {(() => {
                            const workoutRunType = session.workoutId
                              ? workoutRunTypes[session.id]
                              : null;
                            const sessionTypeId =
                              workoutRunType || getSessionRunTypeId(session);
                            // Use uppercase pill label for consistency with Home
                            const typeLabel = workoutRunType
                              ? getRunTypePillLabel(workoutRunType)
                              : sessionTypeId
                                ? getRunTypePillLabelFromModule(sessionTypeId)
                                : "PERSONNALISÉ";
                            return typeLabel ? (
                              <Chip label={typeLabel} variant="default" />
                            ) : null;
                          })()}
                          {session.visibility === "members" && (
                            <Chip label="🔒 MEMBRES" variant="custom" />
                          )}
                          {isCustom && (
                            <Chip label="Créée par toi" variant="success" />
                          )}
                          {isJoined && (
                            <Chip label="INSCRIT" variant="active" />
                          )}
                        </View>
                      </View>
                      <Text style={styles.title}>{session.title}</Text>
                      <Text style={styles.description}>{description}</Text>
                      <Text style={styles.allure}>
                        Allure: {session.targetPace}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                          );
                          router.push(`/session/${session.id}`);
                        }}
                        style={styles.detailsButton}
                      >
                        <Text style={styles.detailsButtonText}>
                          → Voir détails
                        </Text>
                      </TouchableOpacity>
                    </Card>
                  </AnimatedTimelineCard>
                );
              })}
            </View>
          </View>
        )}

        {!isLoading && pastSessions.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Séances passées</Text>
            {pastSessions.map((session) => {
              const description = `${session.volume} · ${session.targetPace}`;
              const isJoined = joinedSet.has(session.id);
              const isCustom = session.isCustom === true;

              return (
                <Card key={session.id} style={styles.sessionCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderTopRow}>
                      <Text style={styles.spotName} numberOfLines={1}>
                        {session.spot}
                      </Text>
                      <Text style={styles.dateText}>{session.dateLabel}</Text>
                    </View>
                    <View style={styles.pillsContainer}>
                      {(() => {
                        const workoutRunType = session.workoutId
                          ? workoutRunTypes[session.id]
                          : null;
                        const sessionTypeId =
                          workoutRunType || getSessionRunTypeId(session);
                        const typeLabel = workoutRunType
                          ? getRunTypePillLabel(workoutRunType)
                          : sessionTypeId
                            ? getRunTypePillLabelFromModule(sessionTypeId)
                            : "PERSONNALISÉ";
                        return typeLabel ? (
                          <Chip label={typeLabel} variant="default" />
                        ) : null;
                      })()}
                      {session.visibility === "members" && (
                        <Chip label="🔒 MEMBRES" variant="custom" />
                      )}
                      {isCustom && (
                        <Chip label="CRÉÉE PAR TOI" variant="success" />
                      )}
                      {isJoined && <Chip label="INSCRIT" variant="active" />}
                      <Chip label="PASSÉE" variant="custom" />
                    </View>
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
      </Animated.ScrollView>

      {/* Bottom gradient fade overlay */}
      <View style={styles.bottomGradient} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
    position: "relative",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 32,
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
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
  },
  headerSubtitle: {
    color: "#BFBFBF",
    fontSize: 15,
  },
  headerAction: {
    color: "#2081FF",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 4,
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
  sectionHeader: {
    marginBottom: 12,
  },
  sectionHeaderText: {
    color: "#BFBFBF",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 4,
  },
  timelineContainer: {
    position: "relative",
    paddingLeft: 20,
  },
  timelineLine: {
    position: "absolute",
    left: 7,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  sessionCardWithTimeline: {
    position: "relative",
    marginBottom: 16,
  },
  timelineDot: {
    position: "absolute",
    left: 0,
    top: 20,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    zIndex: 1,
  },
  timelineDotActive: {
    backgroundColor: "#2081FF",
    width: 10,
    height: 10,
    top: 19,
  },
  sessionCard: {
    backgroundColor: "#131313",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    marginBottom: 16,
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
  allure: {
    color: "#BFBFBF",
    fontSize: 14,
    marginBottom: 12,
  },
  detailsButton: {
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  detailsButtonText: {
    color: "#2081FF",
    fontSize: 14,
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
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "#0B0B0B",
  },
});
