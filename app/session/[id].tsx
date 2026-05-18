import React, { useCallback, useEffect, useRef, useState } from "react";

import {
    Alert,
    Animated,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as Linking from "expo-linking";
import { router, Stack, useLocalSearchParams } from "expo-router";

import { StatGrid3 } from "../../components/redesign/StatGrid3";
import { Tag } from "../../components/redesign/Tag";
import { SessionCoachAdviceCard } from "../../components/session/SessionCoachAdviceCard";
import {
  SessionRunnersPanel,
  type RunnersFilter,
} from "../../components/session/SessionRunnersPanel";
import { InterGroupJoinPanel } from "../../components/session/InterGroupJoinPanel";
import { borderRadius, colors, hairline, typography } from "../../constants/ui";
import { buildCoachContext, type CoachContext } from "../../lib/coach";
import {
    getJoinedSession,
    getJoinedSessions,
    removeJoinedSession,
    upsertJoinedSession,
} from "../../lib/joinedSessionsStore";
import { LoadingState } from "../../components/ui/LoadingState";
import { Toast } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import { confirmAction } from "../../lib/confirmAction";
import {
  getClubAdminSettings,
  memberGroupFromSettings,
  type ClubAdminSettings,
} from "../../lib/clubAdminStore";
import type { ClubPaceGroupId } from "../../lib/clubPaceGroups";
import { inferUserClubGroupId } from "../../lib/clubPaceGroups";
import {
  resolveCrossGroupJoinState,
} from "../../lib/interGroupPolicy";
import { getAuthUser } from "../../lib/authStore";
import {
    createApiClient,
    assignSessionGroup,
    getClubRoster,
    getMyMemberships,
    getSession as getSessionApi,
    getSessionParticipants,
    joinSession as joinSessionApi,
    leaveSession as leaveSessionApi,
    requestSessionAccess,
} from "../../lib/api";
import {
  getRunnerProfile,
  getReferencePaces,
  type RunnerProfile,
} from "../../lib/profileStore";
import {
  getAllSessionsIncludingStored,
  getSessionById,
  SESSION_MAP,
  apiSessionToSessionData,
  type SessionData,
} from "../../lib/sessionData";
import { deleteSession } from "../../lib/sessionStore";
import { getRunTypePillLabel, getWorkoutSummary } from "../../lib/workoutHelpers";
import { getWorkout, type WorkoutEntity } from "../../lib/workoutStore";
import { getSessionRunTypeId } from "../../lib/sessionLogic";
import {
  getRunTypePillLabel as getRunTypePillLabelFromModule,
  type RunTypeId as RunTypeIdFromRunTypes,
} from "../../lib/runTypes";
import type { ClubMembership, ClubRosterMember, SessionParticipantsResult } from "../../types/api";
import type { WorkoutBlock, WorkoutStep } from "../../lib/workoutTypes";

function formatSessionDetailSubtitle(s: import("../../lib/sessionData").SessionData): string {
  const spot = (s.spot || "").trim();
  const datePart = s.dateLabel || "";
  const tm = s.timeMinutes;
  const timeStr =
    tm != null && Number.isFinite(tm)
      ? `${Math.floor(tm / 60)}:${String(tm % 60).padStart(2, "0")}`
      : "";
  const parts = [datePart, timeStr, spot].filter(Boolean);
  return parts.join(" · ");
}

// Helper to format seconds to M:SS format
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) {
    return `${minutes}:00`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

// Helper to format seconds to minutes with apostrophe (e.g. "12'", "3'")
function formatMinutesShort(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}'`;
}

// Helper to format a workout step
function formatWorkoutStep(step: WorkoutStep): string {
  if (step.durationSeconds !== undefined) {
    const duration = formatDuration(step.durationSeconds);
    if (step.kind === "interval") {
      return `${duration} effort`;
    } else if (step.kind === "recovery") {
      return `${duration} récup`;
    } else if (
      step.kind === "easy" ||
      step.kind === "warmup" ||
      step.kind === "cooldown"
    ) {
      return `${duration} facile`;
    }
    return step.description;
  }
  if (step.distanceKm !== undefined) {
    return `${step.distanceKm} km`;
  }
  return step.description;
}

// Helper to format a workout block's total duration
function getBlockTotalDuration(block: WorkoutBlock): number {
  const totalSeconds = block.steps.reduce((sum, step) => {
    return sum + (step.durationSeconds ?? 0);
  }, 0);
  return totalSeconds * (block.repeatCount ?? 1);
}

type SessionLoadState = "loading" | "ready" | "not_found";

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [sessionLoadState, setSessionLoadState] =
    useState<SessionLoadState>("loading");
  const [session, setSession] = useState<SessionData | undefined>(undefined);
  const [profile, setProfile] = useState<RunnerProfile | null>(null);
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const { toast, showToast, hideToast } = useToast();

  // Load session: API first, then SESSION_MAP, then stored sessions
  useEffect(() => {
    if (!id) {
      setSession(undefined);
      setSessionLoadState("not_found");
      return;
    }

    const loadSession = async () => {
      setSessionLoadState("loading");
      setSession(undefined);
      try {
        const client = createApiClient();
        const apiSession = await getSessionApi(client, id);
        if (apiSession) {
          setSession(apiSessionToSessionData(apiSession));
          setSessionLoadState("ready");
          return;
        }
      } catch (err) {
        console.warn("API get session failed, trying local:", err);
      }
      if (SESSION_MAP[id]) {
        setSession(SESSION_MAP[id]);
        setSessionLoadState("ready");
        return;
      }
      try {
        const storedSession = await getSessionById(id);
        if (storedSession) {
          setSession(storedSession);
          setSessionLoadState("ready");
        } else {
          setSession(undefined);
          setSessionLoadState("not_found");
        }
      } catch (error) {
        console.warn("Failed to load session:", error);
        setSession(undefined);
        setSessionLoadState("not_found");
      }
    };

    void loadSession();
  }, [id]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const runner = await getRunnerProfile();
        setProfile(runner);
      } catch (error) {
        console.warn("Failed to load profile for session:", error);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const loadMemberships = async () => {
      try {
        const client = createApiClient();
        const result = await getMyMemberships(client);
        setMemberships(result.memberships ?? []);
      } catch (error) {
        console.warn("Failed to load memberships:", error);
      } finally {
      }
    };
    loadMemberships();
  }, []);

  useEffect(() => {
    const loadClubPolicy = async () => {
      if (!session?.clubId) {
        setClubAdminSettings(null);
        setMemberHomeGroupId(null);
        return;
      }
      try {
        const [settings, authUser, joined, paces, runner] = await Promise.all([
          getClubAdminSettings(session.clubId),
          getAuthUser(),
          getJoinedSessions(),
          getReferencePaces(),
          getRunnerProfile(),
        ]);
        setClubAdminSettings(settings);
        const assigned =
          authUser && settings
            ? memberGroupFromSettings(authUser.id, settings)
            : null;
        setMemberHomeGroupId(
          assigned ??
            inferUserClubGroupId(runner, joined, paces),
        );
      } catch (error) {
        console.warn("Failed to load club policy:", error);
        setClubAdminSettings(null);
      }
    };
    void loadClubPolicy();
  }, [session?.clubId]);

  // Derived from session, memberships, profile (must be before useEffect that uses them)
  const normalizedHost = session?.hostGroupName
    ? session.hostGroupName.toLowerCase().trim()
    : null;
  const matchingMembership = session?.clubId
    ? memberships.find((m) => m.clubId === session.clubId)
    : normalizedHost
      ? memberships.find((membership) => {
          const clubName = membership.club?.name?.toLowerCase().trim();
          return clubName === normalizedHost;
        })
      : null;
  const membershipStatus = matchingMembership?.status ?? null;
  const profileClubMatch =
    normalizedHost &&
    profile?.clubName?.toLowerCase().trim() === normalizedHost;
  const isApprovedMember =
    membershipStatus === "approved" ||
    (membershipStatus === null && Boolean(profileClubMatch));
  const isPendingMember = membershipStatus === "pending";
  const isCoachOrAdmin =
    membershipStatus === "approved" &&
    (matchingMembership?.role === "coach" ||
      matchingMembership?.role === "admin");
  const clubId = matchingMembership?.clubId ?? null;

  useEffect(() => {
    const loadRoster = async () => {
      if (!isCoachOrAdmin || !clubId) {
        setClubRoster([]);
        return;
      }
      setIsCoachLoading(true);
      try {
        const client = createApiClient();
        const result = await getClubRoster(client, clubId);
        setClubRoster(result.members ?? []);
      } catch (error) {
        console.warn("Failed to load club roster:", error);
        setClubRoster([]);
      } finally {
        setIsCoachLoading(false);
      }
    };
    loadRoster();
  }, [isCoachOrAdmin, clubId]);

  // Initialize selected group state with recommended group as default
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    session && "recommendedGroupId" in session
      ? session.recommendedGroupId
      : null,
  );
  // Track joined group ID
  const [joinedGroupId, setJoinedGroupId] = useState<string | null>(null);
  // Track whether a saved joined session exists in AsyncStorage
  const [hasStoredJoin, setHasStoredJoin] = useState(false);
  // Track linked workout
  const [linkedWorkout, setLinkedWorkout] = useState<WorkoutEntity | null>(
    null,
  );
  const [workoutLoadError, setWorkoutLoadError] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const canJoin = session
    ? session.visibility !== "members" || Boolean(isApprovedMember)
    : false;

  const [clubRoster, setClubRoster] = useState<ClubRosterMember[]>([]);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [assignMember, setAssignMember] = useState<ClubRosterMember | null>(
    null,
  );
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignGroupId, setAssignGroupId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [participantsData, setParticipantsData] = useState<SessionParticipantsResult | null>(null);
  const [participantsError, setParticipantsError] = useState<"forbidden" | "unavailable" | null>(null);
  const [clubAdminSettings, setClubAdminSettings] =
    useState<ClubAdminSettings | null>(null);
  const [memberHomeGroupId, setMemberHomeGroupId] =
    useState<ClubPaceGroupId | null>(null);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [coachAssignments, setCoachAssignments] = useState<
    Record<string, string>
  >({});
  const [sessionDetailTab, setSessionDetailTab] = useState<"info" | "runners">(
    "info",
  );
  const [runnersFilter, setRunnersFilter] = useState<RunnersFilter>("all");
  const [runnersNoGroupOnly, setRunnersNoGroupOnly] = useState(false);
  const [coachEngineContext, setCoachEngineContext] = useState<CoachContext>({
    screen: "session_detail",
  });

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const [joined, sessions] = await Promise.all([
        getJoinedSessions(),
        getAllSessionsIncludingStored(),
      ]);
      const sessionType =
        linkedWorkout?.runType ??
        getSessionRunTypeId(session) ??
        session.typeLabel;
      setCoachEngineContext(
        buildCoachContext({
          screen: "session_detail",
          sessions,
          joinedIds: new Set(joined.map((j) => j.sessionId)),
          sessionType: sessionType ?? undefined,
          sessionPace: session.targetPace,
          userGroup: joinedGroupId ?? selectedGroupId ?? undefined,
        }),
      );
    })();
  }, [session, joinedGroupId, selectedGroupId, linkedWorkout]);

  useEffect(() => {
    if (session) {
      // Load saved group from async store
      const loadJoinedSession = async () => {
        const savedJoined = await getJoinedSession(session.id);
        if (savedJoined) {
          // Use saved group
          setSelectedGroupId(savedJoined.groupId);
          setJoinedGroupId(savedJoined.groupId);
          setHasStoredJoin(true);
        } else {
          // Otherwise use recommended group, or first group if no recommended
          const defaultId =
            session.recommendedGroupId || session.paceGroups[0]?.id || null;
          setSelectedGroupId(defaultId);
          setJoinedGroupId(null);
          setHasStoredJoin(false);
        }
      };
      loadJoinedSession();
    }
  }, [session]);

  // Load linked workout if session has workoutId
  useEffect(() => {
    if (!session) {
      setLinkedWorkout(null);
      setWorkoutLoadError(false);
      return;
    }

    const loadLinkedWorkout = async () => {
      if (!session.workoutId) {
        setLinkedWorkout(null);
        setWorkoutLoadError(false);
        return;
      }

      try {
        const workout = await getWorkout(session.workoutId);
        if (workout) {
          setLinkedWorkout(workout);
          setWorkoutLoadError(false);
        } else {
          setLinkedWorkout(null);
          setWorkoutLoadError(true);
        }
      } catch (error) {
        console.warn("Failed to load linked workout:", error);
        setLinkedWorkout(null);
        setWorkoutLoadError(true);
      }
    };

    loadLinkedWorkout();
  }, [session]);

  useEffect(() => {
    if (!session?.recommendedGroupId) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim, session?.recommendedGroupId]);

  const loadParticipantsList = useCallback(async () => {
    if (!session || session.isCustom) return;
    setParticipantsLoading(true);
    setParticipantsError(null);
    try {
      const client = createApiClient();
      const result = await getSessionParticipants(
        client,
        session.id,
        session.visibility === "public" ? { auth: false } : {},
      );
      if (result && "error" in result) {
        setParticipantsError(result.error);
        setParticipantsData(null);
      } else if (result) {
        setParticipantsData(result);
        setParticipantsError(null);
      } else {
        setParticipantsError("unavailable");
      }
    } catch {
      setParticipantsError("unavailable");
    } finally {
      setParticipantsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (sessionDetailTab !== "runners") return;
    if (!session || session.isCustom) return;
    if (participantsData !== null || participantsError !== null) return;
    void loadParticipantsList();
  }, [
    sessionDetailTab,
    session,
    participantsData,
    participantsError,
    loadParticipantsList,
  ]);

  useEffect(() => {
    setParticipantsData(null);
    setParticipantsError(null);
    setSessionDetailTab("info");
    setRunnersFilter("all");
    setRunnersNoGroupOnly(false);
  }, [id]);

  if (sessionLoadState === "loading") {
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
        </View>
        <LoadingState message="Chargement de la séance…" />
      </SafeAreaView>
    );
  }

  if (sessionLoadState === "not_found" || !session) {
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
          <Text style={styles.screenTitle}>Séance introuvable</Text>
          <Text style={styles.notFoundHint}>
            Cette séance n&apos;existe plus ou n&apos;est pas accessible.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const joinedGroup = joinedGroupId
    ? session.paceGroups.find((g) => g.id === joinedGroupId)
    : null;

  const sessionAnchorGroupId = (session.recommendedGroupId ??
    session.paceGroups[0]?.id ??
    null) as ClubPaceGroupId | null;

  const selectedPaceGroupId = (selectedGroupId ??
    sessionAnchorGroupId) as ClubPaceGroupId | null;

  const handleSave = async () => {
    const currentGroupId =
      selectedGroupId ||
      session.recommendedGroupId ||
      session.paceGroups[0]?.id;
    if (!currentGroupId) {
      showToast("Choisis un groupe.", "error");
      return;
    }
    const joinState = resolveCrossGroupJoinState({
      memberGroupId: memberHomeGroupId,
      sessionTargetGroupId: currentGroupId as ClubPaceGroupId,
      settings: clubAdminSettings,
    });
    if (joinState === "locked") {
      showToast(
        "Cette séance n'est pas disponible pour ton groupe.",
        "error",
      );
      return;
    }
    try {
      const client = createApiClient();
      try {
        await joinSessionApi(client, session.id, { groupId: currentGroupId });
      } catch (apiErr) {
        console.warn("API join failed, saving locally:", apiErr);
      }
      await upsertJoinedSession(session.id, currentGroupId);
      setJoinedGroupId(currentGroupId);
      showToast("Tu es inscrit à cette séance.", "success");
    } catch (error) {
      console.warn("Failed to save joined session:", error);
      showToast("Impossible d'enregistrer le groupe.", "error");
    }
  };

  const handleRequestJoin = async () => {
    if (!session) return;
    try {
      const client = createApiClient();
      const groupId =
        selectedGroupId ||
        session.recommendedGroupId ||
        session.paceGroups[0]?.id ||
        null;
      await requestSessionAccess(client, session.id, groupId);
      showToast("Demande envoyée. Le responsable du club sera notifié.", "success");
    } catch (error) {
      console.warn("Failed to request join:", error);
      const coachPhone = session.coachPhone;
      const clubLabel = profile?.clubName ? ` (${profile.clubName})` : "";
      const message = encodeURIComponent(
        `Bonjour, je souhaite rejoindre la séance "${session.title}" le ${session.dateLabel}${clubLabel}. Merci !`,
      );

      if (coachPhone) {
        const whatsappUrl = `https://wa.me/${coachPhone.replace(/[^0-9]/g, "")}?text=${message}`;
        Linking.openURL(whatsappUrl).catch((err) => {
          console.warn("Failed to open WhatsApp:", err);
          showToast("Impossible d'ouvrir WhatsApp.", "error");
        });
        return;
      }

      showToast("Impossible d'envoyer la demande.", "error");
    }
  };

  const groupOptions = session?.paceGroups?.map((group) => ({
    id: group.id,
    label: group.label ?? `Groupe ${group.id}`,
  })) ?? [];

  const openAssignModal = (member: ClubRosterMember) => {
    setAssignMember(member);
    setAssignGroupId(coachAssignments[member.userId] ?? null);
    setAssignModalVisible(true);
  };

  const closeAssignModal = () => {
    setAssignModalVisible(false);
    setAssignMember(null);
    setAssignGroupId(null);
  };

  const handleAssignSubmit = async () => {
    if (!assignMember || !assignGroupId || !session) {
      showToast("Choisis un groupe.", "error");
      return;
    }
    setIsAssigning(true);
    try {
      const client = createApiClient();
      await assignSessionGroup(client, session.id, {
        userId: assignMember.userId,
        groupId: assignGroupId,
      });
      setCoachAssignments((prev) => ({
        ...prev,
        [assignMember.userId]: assignGroupId,
      }));
      showToast("Groupe assigné.", "success");
      closeAssignModal();
    } catch (error) {
      console.warn("Failed to assign group:", error);
      showToast("Impossible d'assigner le groupe.", "error");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDelete = async () => {
    if (!session?.isCustom || !session?.id) {
      return;
    }
    try {
      await deleteSession(session.id);
      // Also remove from joined sessions if applicable
      try {
        await removeJoinedSession(session.id);
      } catch {
        // Ignore if not joined
      }
      setShowDeleteModal(false);
      router.back();
    } catch (error) {
      console.warn("Failed to delete session:", error);
    }
  };

  const handleLeave = async () => {
    const ok = await confirmAction({
      title: "Quitter la séance",
      message: "Tu ne seras plus inscrit à cette séance. Continuer ?",
      confirmLabel: "Quitter",
      destructive: true,
    });
    if (!ok) return;

    const sessionId = session.id;
    const isServerSession = !session.isCustom && sessionId;
    let apiSucceeded = false;
    try {
      if (isServerSession) {
        try {
          const client = createApiClient();
          await leaveSessionApi(client, sessionId);
          apiSucceeded = true;
        } catch (apiErr) {
          console.warn("API leave failed:", apiErr);
        }
      }
      await removeJoinedSession(sessionId);
      setJoinedGroupId(null);
      setHasStoredJoin(false);
      const defaultId =
        session.recommendedGroupId || session.paceGroups[0]?.id || null;
      setSelectedGroupId(defaultId);
      showToast(
        isServerSession && !apiSucceeded
          ? "Séance quittée localement."
          : "Tu as quitté la séance.",
        "success",
      );
    } catch (error) {
      console.warn("Failed to leave session:", error);
      showToast("Impossible de quitter la séance.", "error");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={hideToast}
        />
      )}

      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={styles.headerNavRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBackCircle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.headerBackChevron}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerLocation} numberOfLines={1}>
            {session.spot || "Séance"}
          </Text>
          {session.isCustom === true ? (
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: "/session/create",
                  params: { sessionId: session.id },
                });
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.headerMenuAction}>Modifier</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => {
                const phoneNumber = session.coachPhone || "+212708060337";
                const message = encodeURIComponent(
                  `Séance "${session.title}" — ${session.dateLabel}`,
                );
                const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${message}`;
                if (Platform.OS === "web") {
                  void Linking.openURL(whatsappUrl);
                  return;
                }
                Alert.alert("Séance", undefined, [
                  {
                    text: "Partager via WhatsApp",
                    onPress: () => {
                      Linking.openURL(whatsappUrl).catch(() => {
                        showToast("Impossible d'ouvrir WhatsApp.", "error");
                      });
                    },
                  },
                  { text: "Annuler", style: "cancel" },
                ]);
              }}
            >
              <Text style={styles.headerMenuDots}>···</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerTagRow}>
          {(() => {
            const typeLabelStr = linkedWorkout
              ? getRunTypePillLabel(linkedWorkout.runType)
              : getRunTypePillLabelFromModule(
                  getSessionRunTypeId(session) as RunTypeIdFromRunTypes,
                );
            return <Tag label={typeLabelStr} variant="tb" />;
          })()}
          {session.genderRestriction === "women_only" ? (
            <Tag label="100% FEMMES" variant="tpk" />
          ) : null}
          {session.visibility === "members" ? (
            <Tag label="MEMBRES" variant="tgr" />
          ) : null}
        </View>

        <Text style={styles.sessionTitleDisplay}>
          {(linkedWorkout?.name ?? session.title).toUpperCase()}
        </Text>
        <Text style={styles.sessionSubtitle}>
          {formatSessionDetailSubtitle(session)}
        </Text>

        <View style={styles.tabRow}>
          <Pressable
            style={styles.tabCell}
            onPress={() => setSessionDetailTab("info")}
          >
            <Text
              style={[
                styles.tabLabel,
                sessionDetailTab === "info" && styles.tabLabelActive,
              ]}
            >
              Info
            </Text>
            {sessionDetailTab === "info" ? (
              <View style={styles.tabUnderline} />
            ) : (
              <View style={styles.tabUnderlineMuted} />
            )}
          </Pressable>
          {!session.isCustom ? (
            <Pressable
              style={styles.tabCell}
              onPress={() => setSessionDetailTab("runners")}
            >
              <Text
                style={[
                  styles.tabLabel,
                  sessionDetailTab === "runners" && styles.tabLabelActive,
                ]}
              >
                Runners
              </Text>
              {sessionDetailTab === "runners" ? (
                <View style={styles.tabUnderline} />
              ) : (
                <View style={styles.tabUnderlineMuted} />
              )}
            </Pressable>
          ) : null}
        </View>

        {joinedGroupId !== null && joinedGroup && (
          <Text style={styles.joinedStatus}>
            Tu es inscrit à cette séance · {joinedGroup.label} ·{" "}
            {joinedGroup.paceRange}
          </Text>
        )}
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {sessionDetailTab === "runners" && !session.isCustom ? (
          <SessionRunnersPanel
            variant="tab"
            loading={participantsLoading}
            error={participantsError}
            data={participantsData}
            filter={runnersFilter}
            onFilter={setRunnersFilter}
            noGroupOnly={runnersNoGroupOnly}
            onToggleNoGroup={() => setRunnersNoGroupOnly((v) => !v)}
            onGoToClub={() => router.push("/(tabs)/club")}
            onRequestAccess={() => router.push("/(tabs)/club/access")}
          />
        ) : (
          <>
        <StatGrid3
          cells={[
            {
              value: String(session.estimatedDistanceKm),
              sub: "km",
              label: "Distance",
            },
            {
              value: session.targetPace.replace(/\s*\/km\s*/i, "").trim(),
              label: "/km",
              valueColor: colors.text.accent,
            },
            {
              value: String(
                session.paceGroups.reduce((a, g) => a + g.runnersCount, 0) ||
                  "—",
              ),
              label: "Runners",
            },
          ]}
        />

        {/* Session Details Card - on top (Type de course first) */}
        <View style={styles.card}>
          <View style={styles.groupsHeader}>
            <Text style={styles.cardLabel}>INFORMATIONS</Text>
          </View>

          {/* Type de course — first row */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type de course</Text>
            <Text style={styles.infoValue}>{session.typeLabel} ›</Text>
          </View>

          <View style={styles.divider} />

          {/* Compact info rows */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>
              {session.estimatedDistanceKm} km
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rendez-vous</Text>
            <Text style={styles.infoValue}>
              {session.meetingPoint ||
                (session.spot === "Spot 1"
                  ? "Marina Casablanca"
                  : session.spot)}
            </Text>
          </View>

          {session.meetingPointGPS && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>GPS</Text>
              <Text style={styles.infoValue}>{session.meetingPointGPS}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Organisateur</Text>
            <Text style={[styles.infoValue, styles.organizerValue]}>
              {session.coachName || "Équipe GRPD"}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Description - more compact */}
          <Text style={[styles.infoLabelSmall, { marginBottom: 8 }]}>
            À propos de cette séance
          </Text>
          <Text style={styles.descriptionText}>
            {session.typeLabel === "FARTLEK" &&
              "Intervalles avec variations de rythme pour développer l'endurance et la vitesse."}
            {session.typeLabel === "SÉRIES" &&
              "Intervalles structurés sur piste ou route. Travail de vitesse et résistance."}
            {session.typeLabel === "FOOTING" &&
              "Sortie d'endurance à allure confortable pour développer la base aérobie."}
            {session.typeLabel === "PROGRESSIF" &&
              "Sortie progressive avec accélération graduelle pour améliorer l'endurance."}
            {(session.typeLabel === "COURSE LIBRE" ||
              session.typeLabel === "LIBRE") &&
              "Course libre et conviviale. Pas de structure imposée, juste courir ensemble à votre rythme."}
            {(session.typeLabel === "DÉCOUVERTE" ||
              session.typeLabel === "DÉCOUVERTE") &&
              "Sortie découverte pour explorer de nouveaux parcours en groupe. Allure libre et conviviale."}
            {(session.typeLabel === "MARCHE" ||
              session.typeLabel === "WALKING") &&
              "Marche en groupe. Accessible à tous, parfait pour débuter ou se remettre en mouvement."}
            {![
              "FARTLEK",
              "SÉRIES",
              "FOOTING",
              "PROGRESSIF",
              "COURSE LIBRE",
              "LIBRE",
              "DÉCOUVERTE",
              "MARCHE",
              "WALKING",
            ].includes(session.typeLabel) &&
              "Séance d'entraînement structurée pour améliorer la performance."}
          </Text>
        </View>

        {/* Workout Summary Card */}
        {workoutLoadError && session.workoutId ? (
          <View style={styles.inlineErrorBanner}>
            <Text style={styles.inlineErrorText}>
              Impossible de charger le workout lié.
            </Text>
          </View>
        ) : null}
        {linkedWorkout && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>RÉSUMÉ DU WORKOUT</Text>
            <Text style={styles.workoutSummaryText}>
              {getWorkoutSummary(linkedWorkout)}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.whatsappButtonFull}
          onPress={() => {
            const phoneNumber = session.coachPhone || "+212708060337";
            const message = encodeURIComponent(
              `Bonjour, je souhaite rejoindre la séance "${session.title}" le ${session.dateLabel}`,
            );
            const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${message}`;
            Linking.openURL(whatsappUrl).catch((err) => {
              console.warn("Failed to open WhatsApp:", err);
            });
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.whatsappButtonFullText}>Contacter via WhatsApp</Text>
        </TouchableOpacity>

        <SessionCoachAdviceCard
          coachName={session.coachName}
          coachAdvice={session.coachAdvice}
          engineContext={coachEngineContext}
          onAskQuestion={() => {
            const phoneNumber = session.coachPhone || "+212708060337";
            const message = encodeURIComponent(
              `Question sur la séance "${session.title}" le ${session.dateLabel}`,
            );
            const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${message}`;
            Linking.openURL(whatsappUrl).catch(() => {});
          }}
        />

        {/* Groups Section */}
        {session.paceGroupsOverride && session.paceGroupsOverride.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>GROUPES</Text>
            {session.paceGroupsOverride
              .filter((g) => g.isActive)
              .map((groupOverride, index) => {
                // Format pace helper
                const formatPaceValue = (
                  secondsPerKm: number | null,
                ): string => {
                  if (secondsPerKm === null) return "—";
                  const minutes = Math.floor(secondsPerKm / 60);
                  const secs = secondsPerKm % 60;
                  return `${minutes}'${secs.toString().padStart(2, "0")}/km`;
                };

                // Format duration helper
                const formatDurationValue = (
                  seconds: number | null,
                ): string => {
                  if (seconds === null) return "—";
                  const mins = Math.floor(seconds / 60);
                  const secs = seconds % 60;
                  if (secs === 0) {
                    return `${mins}:00`;
                  }
                  return `${mins}:${secs.toString().padStart(2, "0")}`;
                };

                const isIntervalWorkout =
                  linkedWorkout &&
                  (linkedWorkout.runType === "fartlek" ||
                    linkedWorkout.runType === "series");

                // Calculate volume for intervals
                let volumeText: string | null = null;
                if (
                  isIntervalWorkout &&
                  groupOverride.reps !== null &&
                  groupOverride.effortDurationSeconds !== null
                ) {
                  const totalEffort =
                    groupOverride.reps * groupOverride.effortDurationSeconds;
                  const totalRecovery = groupOverride.recoveryDurationSeconds
                    ? (groupOverride.reps - 1) *
                      groupOverride.recoveryDurationSeconds
                    : 0;
                  const totalSeconds = totalEffort + totalRecovery;
                  volumeText = formatDurationValue(totalSeconds);
                }

                // Build interval line if applicable
                let intervalLine: string | null = null;
                if (
                  isIntervalWorkout &&
                  groupOverride.reps !== null &&
                  groupOverride.effortDurationSeconds !== null &&
                  groupOverride.recoveryDurationSeconds !== null
                ) {
                  intervalLine = `${groupOverride.reps} × ${formatDurationValue(groupOverride.effortDurationSeconds)} effort / ${formatDurationValue(groupOverride.recoveryDurationSeconds)} récup`;
                }

                return (
                  <View key={groupOverride.id}>
                    {index > 0 && <View style={styles.divider} />}
                    <View style={styles.groupDetailCard}>
                      <View style={styles.groupDetailHeader}>
                        <View style={styles.groupBadge}>
                          <Text style={styles.groupBadgeText}>
                            {groupOverride.id}
                          </Text>
                        </View>
                        <View style={styles.groupDetailHeaderText}>
                          <Text style={styles.groupDetailCardTitle}>
                            GROUPE {groupOverride.id}
                          </Text>
                          {groupOverride.paceSecondsPerKm !== null && (
                            <Text style={styles.groupPaceValue}>
                              {formatPaceValue(groupOverride.paceSecondsPerKm)}
                            </Text>
                          )}
                          {intervalLine && (
                            <Text style={styles.groupIntervalLine}>
                              {intervalLine}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
          </View>
        ) : session.paceGroups.length > 0 ? (
          /* Legacy: Pace groups card for backward compatibility */
          <View style={styles.card}>
            <View style={styles.groupsHeader}>
              <Text style={styles.cardLabel}>
                Choisis ton groupe (tu peux changer ensuite)
              </Text>
              <Text style={styles.groupsSubtext}>
                Choisis l’allure qui te convient aujourd’hui.
              </Text>
            </View>
            {(() => {
              const recommendedGroup = session.paceGroups.find(
                (g) => g.id === session.recommendedGroupId,
              );
              return (
                <>
                  {recommendedGroup && (
                    <View style={styles.compatStrip}>
                      <Text style={styles.compatStripTitle}>
                        TA COMPATIBILITÉ
                      </Text>
                      <Text style={styles.compatStripText}>
                        Parfait pour toi ·{" "}
                        <Text style={styles.compatStripTextStrong}>
                          {recommendedGroup.label} ·{" "}
                          {recommendedGroup.paceRange}
                        </Text>
                      </Text>
                    </View>
                  )}
                  <View style={styles.groupsList}>
                    {session.paceGroups.map((group, index) => {
                      const isRecommended =
                        group.id === session.recommendedGroupId;
                      const isSelected = group.id === selectedGroupId;
                      const animatedStyle = isRecommended
                        ? {
                            transform: [
                              {
                                scale: pulseAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [1, 1.02],
                                }),
                              },
                            ],
                          }
                        : undefined;
                      return (
                        <View key={group.id}>
                          <Animated.View style={animatedStyle}>
                            <TouchableOpacity
                              style={[
                                styles.groupRow,
                                isSelected && styles.groupRowSelected,
                                isRecommended && styles.groupRowRecommended,
                              ]}
                              activeOpacity={0.8}
                              onPress={() => setSelectedGroupId(group.id)}
                            >
                              <View style={styles.groupLeft}>
                                <View style={styles.groupLabelRow}>
                                  <Text style={styles.groupLabel}>
                                    {group.label}
                                  </Text>
                                  {isRecommended && (
                                    <View style={styles.recommendedTag}>
                                      <Text style={styles.recommendedTagText}>
                                        Recommandé
                                      </Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={styles.groupPace}>
                                  {group.paceRange}
                                </Text>
                              </View>
                              <View style={styles.groupRight}>
                                {isSelected && (
                                  <View style={styles.selectedCheck}>
                                    <Text style={styles.selectedCheckText}>
                                      ✓
                                    </Text>
                                  </View>
                                )}
                                <View style={styles.runnersBadge}>
                                  <Text style={styles.runnersBadgeText}>
                                    {group.runnersCount} coureurs
                                  </Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                          </Animated.View>
                        </View>
                      );
                    })}
                  </View>
                </>
              );
            })()}
            {/* Show saved status if already joined */}
            {joinedGroup && (
              <>
                <View style={styles.divider} />
                <View style={styles.savedStatus}>
                  <Text style={styles.savedStatusText}>
                    Inscription enregistrée · {joinedGroup.label} ·{" "}
                    {joinedGroup.paceRange}
                  </Text>
                </View>
              </>
            )}
          </View>
        ) : null}

        {!session.isCustom ? (
          <View style={styles.actionButtonContainer}>
            <InterGroupJoinPanel
              memberGroupId={memberHomeGroupId}
              sessionAnchorGroupId={sessionAnchorGroupId}
              selectedGroupId={selectedPaceGroupId}
              sessionPaceLabel={
                session.paceGroups.find((g) => g.id === sessionAnchorGroupId)
                  ?.paceRange ?? session.targetPace
              }
              settings={clubAdminSettings}
              hasStoredJoin={hasStoredJoin}
              canJoin={canJoin}
              isPendingMember={isPendingMember}
              onJoin={handleSave}
              onRequestJoin={handleRequestJoin}
              onLeave={handleLeave}
              onGoToClub={() => router.push("/(tabs)/club")}
            />
          </View>
        ) : null}

        {isCoachOrAdmin && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>ESPACE COACH</Text>
            <Text style={styles.cardSubtitle}>
              Assigne un groupe pour cette séance.
            </Text>
            {isCoachLoading ? (
              <Text style={styles.coachEmptyText}>Chargement...</Text>
            ) : clubRoster.length === 0 ? (
              <Text style={styles.coachEmptyText}>
                Aucun membre disponible.
              </Text>
            ) : (
              <View style={styles.coachList}>
                {clubRoster.map((member, index) => (
                  <View key={member.membershipId}>
                    {index > 0 && <View style={styles.divider} />}
                    <View style={styles.coachRow}>
                      <View style={styles.coachRowLeft}>
                        <Text style={styles.coachMemberName}>
                          {member.displayName || member.userId || "—"}
                        </Text>
                        <Text style={styles.coachMemberMeta}>
                          {member.role} ·{" "}
                          {member.sharePrs ? "PRs partagés" : "PRs privés"}
                        </Text>
                        {coachAssignments[member.userId] && (
                          <Text style={styles.coachAssignedLabel}>
                            Assigné : Groupe {coachAssignments[member.userId]}
                          </Text>
                        )}
                      </View>
                      <Pressable
                        style={styles.coachAssignButton}
                        onPress={() => openAssignModal(member)}
                      >
                        <Text style={styles.coachAssignButtonText}>
                          Assigner
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Ton rendez-vous card - only shown if joined */}
        {joinedGroupId !== null && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>TON RENDEZ-VOUS</Text>
            <View style={styles.cardSection}>
              <Text style={styles.infoLabelSmall}>Lieu exact</Text>
              <Text style={styles.infoValueSmall}>
                {session.meetingPoint ||
                  (session.spot === "Spot 1"
                    ? "Marina Casablanca - Entrée principale"
                    : session.spot)}
              </Text>
              {session.meetingPointGPS ? (
                <Text style={styles.infoSubtext}>
                  {session.meetingPointGPS}
                </Text>
              ) : (
                <Text style={styles.infoSubtext}>
                  Coordonnées GPS disponibles sur demande
                </Text>
              )}
            </View>
            <View style={styles.divider} />
            <View style={styles.cardSection}>
              <Text style={styles.infoLabelSmall}>Heure de rendez-vous</Text>
              <Text style={styles.infoValueSmall}>
                {session.dateLabel.split(" ").slice(-1)[0]} - 10 min avant le
                départ
              </Text>
              <Text style={styles.infoSubtext}>
                Échauffement collectif avant le départ
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.cardSection}>
              <Text style={styles.infoLabelSmall}>Conseil coach</Text>
              <Text style={styles.infoValueSmall}>
                {session.coachAdvice ||
                  "Prends un tour de chauffe très léger. Hydrate-toi bien avant et après la séance. Vêtements adaptés à la météo."}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.cardSection}>
              <Text style={styles.infoLabelSmall}>En cas d&apos;urgence</Text>
              <TouchableOpacity
                style={styles.whatsappButton}
                onPress={() => {
                  const phoneNumber = session.coachPhone || "+212708060337";
                  const message = encodeURIComponent(
                    `Urgence - Séance ${session.title}`,
                  );
                  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${message}`;
                  Linking.openURL(whatsappUrl).catch((err) => {
                    console.warn("Failed to open WhatsApp:", err);
                  });
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.whatsappButtonText}>
                  📱 Contacter {session.coachName || "le responsable"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer with buttons */}
        {session.isCustom ? (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.modifyButton}
              activeOpacity={0.8}
              onPress={() => {
                router.push({
                  pathname: "/session/create",
                  params: { sessionId: session.id },
                });
              }}
            >
              <Text style={styles.modifyButtonText}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              activeOpacity={0.8}
              onPress={() => setShowDeleteModal(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteButtonText}>Supprimer la séance</Text>
            </TouchableOpacity>
          </View>
        ) : hasStoredJoin ? (
          <View style={styles.footer}>
            <View style={styles.footerButtonGroup}>
              <TouchableOpacity
                style={styles.leaveButton}
                activeOpacity={0.8}
                onPress={handleLeave}
              >
                <Text style={styles.leaveButtonText}>
                  Quitter cette séance
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        </>
        )}
      </ScrollView>

      {/* Coach assign modal */}
      <Modal
        visible={assignModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeAssignModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeAssignModal}>
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Assigner un groupe</Text>
            {assignMember && (
              <Text style={styles.modalMessage}>
                {assignMember.displayName || assignMember.userId || "—"}
              </Text>
            )}
            {groupOptions.length === 0 ? (
              <Text style={styles.coachEmptyText}>
                Aucun groupe défini pour cette séance.
              </Text>
            ) : (
              <View style={styles.coachGroupPillRow}>
                {groupOptions.map((group) => (
                  <Pressable
                    key={group.id}
                    style={[
                      styles.coachGroupPill,
                      assignGroupId === group.id &&
                        styles.coachGroupPillActive,
                    ]}
                    onPress={() => setAssignGroupId(group.id)}
                  >
                    <Text
                      style={[
                        styles.coachGroupPillText,
                        assignGroupId === group.id &&
                          styles.coachGroupPillTextActive,
                      ]}
                    >
                      {group.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={closeAssignModal}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.coachConfirmButton,
                  (!assignGroupId || isAssigning) && styles.modalButtonDisabled,
                ]}
                onPress={handleAssignSubmit}
                disabled={!assignGroupId || isAssigning}
              >
                <Text style={styles.coachConfirmText}>
                  {isAssigning ? "Envoi..." : "Assigner"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDeleteModal(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Supprimer la séance</Text>
            <Text style={styles.modalMessage}>
              Es-tu sûr de vouloir supprimer cette séance ? Cette action est
              irréversible.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleDelete}
              >
                <Text style={styles.modalConfirmText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.background.primary,
  },
  headerNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerBackCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface.s3,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBackChevron: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: "300",
    marginTop: -2,
  },
  headerLocation: {
    flex: 1,
    marginHorizontal: 10,
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  headerMenuDots: {
    color: colors.text.primary,
    fontSize: 18,
    letterSpacing: 1,
    fontWeight: "700",
  },
  headerMenuAction: {
    color: colors.text.accent,
    fontSize: 14,
    fontWeight: "700",
  },
  headerTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  sessionTitleDisplay: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  sessionSubtitle: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: hairline,
    borderBottomColor: colors.border.default,
    marginBottom: 4,
  },
  tabCell: {
    flex: 1,
    alignItems: "stretch",
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.secondary,
    marginBottom: 6,
    textAlign: "center",
  },
  tabLabelActive: {
    color: colors.text.primary,
  },
  tabUnderline: {
    alignSelf: "stretch",
    height: 3,
    width: "100%",
    borderRadius: 2,
    backgroundColor: colors.accent.primary,
  },
  tabUnderlineMuted: {
    alignSelf: "stretch",
    height: 3,
    width: "100%",
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  organizerValue: {
    fontWeight: "700",
  },
  whatsappButtonFull: {
    width: "100%",
    alignSelf: "stretch",
    backgroundColor: colors.whatsapp.bg,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.whatsapp.border,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  whatsappButtonFullText: {
    color: colors.whatsapp.text,
    fontSize: typography.sizes.md,
    fontWeight: "700",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 40,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    color: colors.text.accent,
    fontSize: 16,
    fontWeight: "600",
  },
  backIcon: {
    color: colors.text.accent,
    fontSize: 18,
    marginRight: 4,
  },
  backLabel: {
    color: colors.text.accent,
    fontSize: 16,
    fontWeight: "500",
  },
  notFoundHint: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: 8,
    lineHeight: 20,
  },
  secondaryLinkButton: {
    marginTop: 10,
    alignSelf: "flex-start",
  },
  secondaryLinkButtonText: {
    color: colors.accent.primary,
    fontSize: typography.sizes.sm,
    fontWeight: "700",
  },
  inlineErrorBanner: {
    backgroundColor: colors.accent.orangeDim,
    borderRadius: borderRadius.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: hairline,
    borderColor: colors.accent.orange,
  },
  inlineErrorText: {
    color: colors.accent.orange,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
  },
  screenTitle: {
    color: colors.text.primary,
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 24,
  },
  workoutTitle: {
    color: colors.text.primary,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 26,
    marginBottom: 6,
  },
  headerSubtext: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "400",
    marginBottom: 12,
  },
  joinedStatus: {
    color: colors.text.secondary,
    fontSize: 13,
    marginBottom: 12,
  },
  infoBlock: {
    marginBottom: 0,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoLabel: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  infoValue: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  infoLabelSmall: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 4,
  },
  infoValueSmall: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: "500",
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 14,
    borderWidth: hairline,
    borderColor: colors.border.default,
    paddingHorizontal: 13,
    paddingVertical: 13,
    marginBottom: 9,
  },
  groupsHeader: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    marginBottom: 12,
  },
  compatStrip: {
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface.s2,
    borderWidth: hairline,
    borderColor: colors.border.default,
  },
  compatStripTitle: {
    color: colors.text.accent,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  compatStripText: {
    color: colors.text.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  compatStripTextStrong: {
    color: colors.accent.orange,
    fontSize: 12,
    fontWeight: "500",
  },
  cardLabel: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: colors.text.tertiary,
    fontSize: 12,
    marginTop: 6,
    marginBottom: 12,
  },
  coachList: {
    gap: 12,
  },
  coachRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  coachRowLeft: {
    flex: 1,
  },
  coachMemberName: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  coachMemberMeta: {
    color: colors.text.tertiary,
    fontSize: 12,
  },
  coachAssignedLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 4,
  },
  coachAssignButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  coachAssignButtonText: {
    color: colors.text.accent,
    fontSize: 12,
    fontWeight: "600",
  },
  coachEmptyText: {
    color: colors.text.tertiary,
    fontSize: 13,
  },
  groupsSubtext: {
    color: colors.text.tertiary,
    fontSize: 12,
  },
  groupsList: {
    gap: 10,
  },
  groupRow: {
    backgroundColor: colors.surface.s3,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderWidth: 1.5,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  groupRowSelected: {
    backgroundColor: colors.accent.primaryMid,
    borderColor: colors.accent.primary,
  },
  groupRowRecommended: {
    borderColor: colors.accent.orange,
    backgroundColor: colors.groupRow.recommendedBg,
  },
  groupRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  selectedCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCheckText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  groupLeft: {
    flexShrink: 1,
    flex: 1,
  },
  groupLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 4,
    marginBottom: 4,
  },
  groupLabel: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  recommendedTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: colors.tag.orangeBg,
  },
  recommendedTagText: {
    color: colors.tag.orangeText,
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  groupPace: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: "500",
  },
  runnersBadge: {
    backgroundColor: colors.tag.grayBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  runnersBadgeText: {
    color: colors.tag.grayText,
    fontSize: 12,
    fontWeight: "600",
  },
  cardSection: {
    marginBottom: 16,
  },
  workoutLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 6,
  },
  cardValue: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 16,
  },
  workoutLinkContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
  },
  workoutLinkText: {
    color: colors.text.accent,
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
  },
  workoutErrorText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontStyle: "italic",
  },
  savedStatus: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(32, 129, 255, 0.1)",
  },
  savedStatusText: {
    color: colors.text.accent,
    fontSize: 13,
    fontWeight: "500",
  },
  actionButtonContainer: {
    marginTop: 8,
    marginBottom: 24,
    alignItems: "stretch",
    gap: 12,
  },
  footer: {
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: "stretch",
  },
  footerButtonGroup: {
    alignItems: "stretch",
    gap: 12,
  },
  saveButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  saveButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  requestButton: {
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.medium,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  requestButtonDisabled: {
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.medium,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    opacity: 0.6,
  },
  requestButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  membersOnlyHint: {
    marginTop: 4,
    color: colors.text.secondary,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  leaveButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  leaveButtonText: {
    color: colors.text.secondary,
    fontSize: 15,
    fontWeight: "500",
  },
  modifyButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modifyButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "500",
  },
  workoutSummaryText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
  },
  groupDetailCard: {
    marginTop: 8,
    padding: 16,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  groupDetailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  groupBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  groupBadgeText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  groupDetailHeaderText: {
    flex: 1,
  },
  groupDetailCardTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  groupPaceValue: {
    color: colors.text.accent,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  groupIntervalLine: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "400",
  },
  groupDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  groupDetailLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "400",
  },
  groupDetailValue: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalMessage: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  modalCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  modalCancelText: {
    color: colors.text.secondary,
    fontSize: 15,
    fontWeight: "600",
  },
  modalConfirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FF3B30",
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalConfirmText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  coachConfirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.accent.primary,
  },
  coachConfirmText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  coachGroupPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  coachGroupPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  coachGroupPillActive: {
    borderColor: colors.accent.primary,
    backgroundColor: "rgba(32, 129, 255, 0.15)",
  },
  coachGroupPillText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "600",
  },
  coachGroupPillTextActive: {
    color: colors.text.accent,
  },
  workoutCardLabel: {
    color: "#8A8A8A",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  workoutDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  workoutDetailLabel: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "500",
  },
  workoutDetailValue: {
    color: "#D0D0D0",
    fontSize: 15,
    fontWeight: "500",
  },
  groupDetailSection: {
    paddingVertical: 12,
  },
  groupDetailTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  groupDetailText: {
    color: "#D0D0D0",
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 4,
  },
  groupDetailSubtext: {
    color: "#8A8A8A",
    fontSize: 12,
    fontWeight: "400",
    marginTop: 4,
  },
  infoSubtext: {
    color: "#8A8A8A",
    fontSize: 11,
    fontWeight: "400",
    marginTop: 4,
    fontStyle: "italic",
  },
  descriptionText: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  whatsappButton: {
    backgroundColor: colors.whatsapp.bg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: hairline,
    borderColor: colors.whatsapp.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    alignSelf: "flex-start",
  },
  whatsappButtonText: {
    color: colors.whatsapp.text,
    fontSize: 12,
    fontWeight: "600",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  participantsToggle: {
    color: colors.text.accent,
    fontSize: 14,
    fontWeight: "600",
  },
  participantsGroup: {
    marginTop: 12,
    marginBottom: 8,
  },
  participantsGroupTitle: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  participantsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  participantsName: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  participantsPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  participantsPillText: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: "600",
  },
});
