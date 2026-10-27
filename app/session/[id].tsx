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

import { StitoOutingHero } from "../../components/outingDetail/StitoOutingHero";
import { StitoMetricsStrip } from "../../components/outingDetail/StitoMetricsStrip";
import { StitoStickyJoinBar } from "../../components/outingDetail/StitoStickyJoinBar";
import { StitoHostCard } from "../../components/outingDetail/StitoHostCard";
import { StitoPurposeSection } from "../../components/outingDetail/StitoPurposeSection";
import { StitoLogisticsCard } from "../../components/outingDetail/StitoLogisticsCard";
import { StitoParticipantsCard } from "../../components/outingDetail/StitoParticipantsCard";
import { StitoAccessNote } from "../../components/outingDetail/StitoAccessNote";
import { stitoTheme } from "../../constants/stitoTheme";
import { formatTimeLabel } from "../../lib/homeViewModel";
import { formatOutingDateTime } from "../../lib/mesSortiesViewModel";
import {
  SessionRunnersPanel,
  type RunnersFilter,
} from "../../components/session/SessionRunnersPanel";
import { InterGroupJoinPanel } from "../../components/session/InterGroupJoinPanel";
import { borderRadius, colors, hairline, typography } from "../../constants/ui";
import {
  formatSessionDistanceKm,
  formatSessionDistanceLabel,
  formatSessionPaceLabel,
} from "../../lib/sessionDisplay";

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
  // dateLabel already includes HH:MM when built via formatDateLabel — do not append time again
  const datePart = (s.dateLabel || "").trim();
  const parts = [datePart, spot].filter(Boolean);
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
  const [authUserId, setAuthUserId] = useState<string | null>(null);
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
        // Intentional API 403/404 (e.g. members-only privacy) must not be
        // resurrected from a local cache copy — that would leak logistics.
        const status =
          err && typeof err === "object" && "status" in err
            ? Number((err as { status?: number }).status)
            : null;
        if (status === 404 || status === 403) {
          setSession(undefined);
          setSessionLoadState("not_found");
          return;
        }
        console.warn("API get session failed, trying local:", err);
      }
      // Offline / seed fallback only when the API did not deliberately hide it.
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
        const [runner, auth] = await Promise.all([
          getRunnerProfile(),
          getAuthUser(),
        ]);
        setProfile(runner);
        setAuthUserId(auth?.id ?? null);
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
  // Membership status is authoritative — profile.clubName must not silently grant access
  const isApprovedMember = membershipStatus === "approved";
  const isPendingMember = membershipStatus === "pending";
  const isCoachOrAdmin =
    membershipStatus === "approved" &&
    (matchingMembership?.role === "coach" ||
      matchingMembership?.role === "admin");
  const clubId = matchingMembership?.clubId ?? null;
  // Organizer controls require host identity — isCustom alone is not ownership
  const isOrganizer =
    Boolean(authUserId) &&
    Boolean(session?.hostUserId) &&
    session!.hostUserId === authUserId;

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
  /** M06 — cancel participation confirm (≠ leave club). */
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeavingOuting, setIsLeavingOuting] = useState(false);
  const [isJoiningOuting, setIsJoiningOuting] = useState(false);
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
    if (!session) return;
    let cancelled = false;
    // Load saved group from async store
    const loadJoinedSession = async () => {
      const savedJoined = await getJoinedSession(session.id);
      if (cancelled) return;
      const apiStatus = session.attendanceStatus ?? null;
      const defaultId =
        session.recommendedGroupId || session.paceGroups[0]?.id || null;
      // Per-user API/mock attendance wins over device-global joinedSessions
      // (local store is not keyed by userId — must not show host join to participant).
      if (apiStatus === "joined") {
        const gid = session.attendanceGroupId ?? savedJoined?.groupId ?? null;
        const uiGid = gid === "open" ? null : gid;
        setSelectedGroupId(uiGid);
        setJoinedGroupId(uiGid);
        setHasStoredJoin(true);
        return;
      }
      if (
        apiStatus === "left" ||
        apiStatus === "declined" ||
        (apiStatus == null && session.hostUserId)
      ) {
        setSelectedGroupId(defaultId || null);
        setJoinedGroupId(null);
        setHasStoredJoin(false);
        return;
      }
      if (savedJoined) {
        const gid =
          savedJoined.groupId === "open" ? null : savedJoined.groupId;
        setSelectedGroupId(gid);
        setJoinedGroupId(gid);
        setHasStoredJoin(true);
        return;
      }
      setSelectedGroupId(defaultId || null);
      setJoinedGroupId(null);
      setHasStoredJoin(false);
    };
    void loadJoinedSession();
    return () => {
      cancelled = true;
    };
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
    // M08 inaccessible — never reveal club name, spot, date, or private logistics.
    return (
      <SafeAreaView style={styles.safeArea} testID="session-inaccessible">
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backRow}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backLabel}>Retour</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inaccessibleBody}>
          <Text style={styles.inaccessibleTitle} testID="session-inaccessible-title">
            Cette sortie n&apos;est pas accessible.
          </Text>
          <Text style={styles.notFoundHint}>
            Elle est introuvable ou ton compte n&apos;y a pas accès.
          </Text>
          <View style={styles.inaccessibleCard}>
            <Text style={styles.inaccessibleCardTitle}>Retrouvons ton chemin</Text>
            <Text style={styles.inaccessibleCardBody}>
              Vérifie que tu utilises le bon compte ou retourne à tes clubs.
            </Text>
          </View>
          <Pressable
            testID="session-inaccessible-clubs-cta"
            accessibilityRole="button"
            accessibilityLabel="Retour à mes clubs"
            style={({ pressed }) => [
              styles.inaccessiblePrimaryBtn,
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => router.replace("/(tabs)/club")}
          >
            <Text style={styles.inaccessiblePrimaryBtnText}>
              Retour à mes clubs
            </Text>
          </Pressable>
          <Pressable
            testID="session-inaccessible-discover-cta"
            accessibilityRole="button"
            accessibilityLabel="Découvrir les sorties"
            style={styles.secondaryLinkButton}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.secondaryLinkButtonText}>
              Découvrir les sorties
            </Text>
          </Pressable>
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
    if (isJoiningOuting || hasStoredJoin) return;
    const hasPaceGroups = (session.paceGroups?.length ?? 0) > 0;
    const currentGroupId = hasPaceGroups
      ? selectedGroupId ||
        session.recommendedGroupId ||
        session.paceGroups[0]?.id ||
        null
      : "open";
    if (hasPaceGroups && !currentGroupId) {
      showToast("Choisis un groupe.", "error");
      return;
    }
    if (hasPaceGroups) {
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
    }
    setIsJoiningOuting(true);
    try {
      const client = createApiClient();
      let apiJoined = false;
      try {
        await joinSessionApi(client, session.id, {
          groupId: currentGroupId || "open",
        });
        apiJoined = true;
      } catch (apiErr) {
        const status =
          apiErr && typeof apiErr === "object" && "status" in apiErr
            ? Number((apiErr as { status?: number }).status)
            : null;
        // Members-only / auth failures must not fake success via local join.
        if (
          session.visibility === "members" ||
          status === 401 ||
          status === 403 ||
          status === 404
        ) {
          console.warn("API join denied:", apiErr);
          showToast(
            status === 403 || session.visibility === "members"
              ? "Réservé aux membres du club."
              : "Impossible de t'inscrire pour le moment.",
            "error",
          );
          return;
        }
        // Transient failures (e.g. demo fail-next flag / 5xx): keep join CTA for retry.
        if (status === 503 || status === 500 || status === 502) {
          console.warn("API join temporary failure:", apiErr);
          showToast("Inscription temporairement impossible. Réessaie.", "error");
          return;
        }
        console.warn("API join failed, saving locally:", apiErr);
      }
      const storedGroupId = currentGroupId || "open";
      await upsertJoinedSession(session.id, storedGroupId);
      setJoinedGroupId(hasPaceGroups ? storedGroupId : null);
      setHasStoredJoin(true);
      showToast(
        apiJoined
          ? "Tu es inscrit à cette séance."
          : "Inscription enregistrée sur cet appareil.",
        "success",
      );
    } catch (error) {
      console.warn("Failed to save joined session:", error);
      showToast("Impossible d'enregistrer le groupe.", "error");
    } finally {
      setIsJoiningOuting(false);
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

  const openLeaveConfirm = () => {
    setShowLeaveModal(true);
  };

  const handleLeaveConfirm = async () => {
    if (isLeavingOuting) return;
    setIsLeavingOuting(true);
    const sessionId = session.id;
    const isServerSession = Boolean(sessionId);
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
      setShowLeaveModal(false);
      showToast(
        isServerSession && !apiSucceeded
          ? "Participation annulée sur cet appareil."
          : "Participation annulée. Tu restes membre du club.",
        "success",
      );
    } catch (error) {
      console.warn("Failed to leave session:", error);
      showToast("Impossible d'annuler la participation.", "error");
    } finally {
      setIsLeavingOuting(false);
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
          tone="onLight"
          placement="top"
        />
      )}

      {/* Slim fixed chrome — Stitch: title row + city / Modifier context */}
      <View style={styles.header}>
        <View style={styles.headerNavRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBackCircle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Text style={styles.headerBackChevron}>‹</Text>
          </TouchableOpacity>
          <Text
            style={styles.headerLocation}
            numberOfLines={1}
            testID="session-detail-nav-title"
          >
            Détail de la sortie
          </Text>
          <View style={styles.headerAvatarMark} accessibilityElementsHidden>
            <Text style={styles.headerAvatarMarkText}>·</Text>
          </View>
        </View>
        <View style={styles.headerContextRow}>
          <Text style={styles.headerCityLabel} numberOfLines={1}>
            {(
              matchingMembership?.club?.city ||
              memberships.find((m) => m.club?.city)?.club?.city ||
              "Casablanca"
            ).toString()}
          </Text>
          {isOrganizer ? (
            <TouchableOpacity
              testID="session-modify-btn"
              onPress={() => {
                router.push({
                  pathname: "/session/create",
                  params: { sessionId: session.id },
                });
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Modifier la sortie"
            >
              <Text style={styles.headerMenuAction}>Modifier</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => {
                const phoneNumber = session.coachPhone?.trim();
                if (!phoneNumber) {
                  showToast("Aucun contact pour cette sortie.", "error");
                  return;
                }
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
              accessibilityRole="button"
              accessibilityLabel="Plus d'actions"
            >
              <Text style={styles.headerMenuDots}>···</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        testID="session-detail-scroll"
      >
        {(() => {
          const typeLabelStr = linkedWorkout
            ? getRunTypePillLabel(linkedWorkout.runType)
            : getRunTypePillLabelFromModule(
                getSessionRunTypeId(session) as RunTypeIdFromRunTypes,
              );
          const typeUpper = (session.typeLabel || typeLabelStr || "").toUpperCase();
          const isWalkLike =
            typeUpper.includes("MARCHE") ||
            typeUpper.includes("WALKING") ||
            typeUpper.startsWith("LANGUES");
          const raw = linkedWorkout?.name ?? session.title;
          const title = raw;
          const typeMeta = (
            typeLabelStr ||
            (session.genderRestriction === "women_only" ? "Femmes" : "") ||
            ""
          )
            .toString()
            .toUpperCase();
          return (
            <View style={styles.stitoHeroWrap}>
              <StitoOutingHero
                title={title}
                metaLine={typeMeta || null}
                contextLabel={
                  session.visibility === "members"
                    ? "Réservée aux membres"
                    : "Ouverte à tous"
                }
              />
            </View>
          );
        })()}

        {/* Stitch editorial: no Infos/Coureurs chrome — runners stay available via club. */}

        {joinedGroupId !== null && joinedGroup ? (
          <Text style={styles.joinedStatus}>
            Tu es inscrit·e · {joinedGroup.label} · {joinedGroup.paceRange}
          </Text>
        ) : null}

        <>
        {/* Stitch composition: logistics → host → access → purpose → participants */}
        {(() => {
          const typeUpper = (session.typeLabel || "").toUpperCase();
          const vol = session.volume?.trim() || "";
          const isLangues = typeUpper.startsWith("LANGUES");
          const languageOnly =
            isLangues &&
            vol.length <= 40 &&
            !/[·•]/.test(vol) &&
            !/\d+\s*(min|×|x)/i.test(vol);
          const purposeText = session.coachAdvice?.trim()
            ? session.coachAdvice.trim()
            : session.typeLabel === "FARTLEK"
              ? "Intervalles avec variations de rythme pour développer l'endurance et la vitesse."
              : session.typeLabel === "SÉRIES"
                ? "Intervalles structurés sur piste ou route. Travail de vitesse et résistance."
                : session.typeLabel === "FOOTING"
                  ? "Sortie d'endurance à allure confortable pour développer la base aérobie."
                  : session.typeLabel === "PROGRESSIF"
                    ? "Sortie progressive avec accélération graduelle pour améliorer l'endurance."
                    : session.typeLabel === "COURSE LIBRE" ||
                        session.typeLabel === "LIBRE"
                      ? "Course libre et conviviale. Pas de structure imposée, juste courir ensemble à votre rythme."
                      : session.typeLabel === "DÉCOUVERTE"
                        ? "Sortie découverte pour explorer de nouveaux parcours en groupe. Allure libre et conviviale."
                        : session.typeLabel === "MARCHE" ||
                            session.typeLabel === "WALKING" ||
                            typeUpper.startsWith("LANGUES")
                          ? "Marche en groupe. Accessible à tous — aucun rythme de course imposé."
                          : "Séance d'entraînement structurée pour améliorer la performance.";
          const clubLabel =
            matchingMembership?.club?.name?.trim() ||
            session.hostGroupName?.trim() ||
            null;
          const hostName =
            session.coachName?.trim() ||
            clubLabel ||
            "Organisateur";
          const hostRole =
            session.coachName?.trim()
              ? "Organisateur"
              : clubLabel
                ? "Club hôte"
                : null;
          const placeTitle =
            session.meetingPoint?.trim() || session.spot?.trim() || "—";
          const placeDetail =
            session.meetingPoint?.trim() &&
            session.spot?.trim() &&
            session.meetingPoint.trim() !== session.spot.trim()
              ? `Point de repère : ${session.spot.trim()}.`
              : session.visibility === "members" && session.hostGroupName?.trim()
                ? `Club · ${session.hostGroupName.trim()}`
                : null;
          const joinedFromApi = participantsData?.counts?.joined ?? null;
          const joinedFromGroups = (session.paceGroups ?? []).reduce(
            (a, g) => a + (g.runnersCount ?? 0),
            0,
          );
          const joinedCount =
            joinedFromApi != null && joinedFromApi > 0
              ? joinedFromApi
              : joinedFromGroups > 0
                ? joinedFromGroups
                : hasStoredJoin
                  ? 1
                  : 0;
          const participantNames = (participantsData?.groups ?? [])
            .flatMap((g) => g.participants ?? [])
            .map((p) => (p.displayName || "").trim())
            .filter(Boolean);
          return (
            <View style={styles.stitoStory} testID="stito-outing-story">
              <StitoLogisticsCard
                dateLine={formatOutingDateTime(session)}
                departureTime={null}
                meetingTime={null}
                placeTitle={placeTitle}
                placeDetail={placeDetail || null}
                isMembersOnly={session.visibility === "members"}
                gpsAvailable={Boolean(session.meetingPointGPS)}
              />
              <View style={styles.stitoRule} />
              {session.clubId &&
              (session.visibility == null || session.visibility === "public") ? (
                <View testID="session-soft-club-row" collapsable={false}>
                  <StitoHostCard
                    hostName={hostName}
                    hostRole={hostRole}
                    clubName={
                      hostName !== clubLabel ? clubLabel : null
                    }
                    onClubPress={() => router.push("/(tabs)/club")}
                  />
                </View>
              ) : (
                <StitoHostCard
                  hostName={hostName}
                  hostRole={
                    session.visibility === "members"
                      ? "Organisateur club"
                      : hostRole
                  }
                  clubName={
                    session.visibility === "members"
                      ? session.hostGroupName?.trim() ||
                        (hostName !== clubLabel ? clubLabel : null)
                      : hostName !== clubLabel
                        ? clubLabel
                        : null
                  }
                  onClubPress={
                    clubLabel ? () => router.push("/(tabs)/club") : undefined
                  }
                />
              )}
              {session.visibility === "members" &&
              session.hostGroupName?.trim() ? (
                <View testID="session-target-group-row" style={{ height: 0 }} />
              ) : null}
              <View style={styles.stitoRule} />
              <StitoAccessNote visibility={session.visibility} />
              <View style={styles.stitoRule} />
              <StitoPurposeSection
                purposeText={purposeText}
                structureText={languageOnly || !vol ? null : vol}
                languageLabel={languageOnly ? vol : null}
              />
              <View style={styles.stitoRule} />
              <StitoParticipantsCard
                joinedCount={joinedCount}
                names={participantNames}
                isJoined={hasStoredJoin}
                statusLabel={hasStoredJoin ? "Confirmé" : null}
              />
            </View>
          );
        })()}

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

        {session.coachPhone?.trim() ? (
          <TouchableOpacity
            style={styles.whatsappButtonFull}
            onPress={() => {
              const phoneNumber = session.coachPhone!.trim();
              const message = encodeURIComponent(
                `Bonjour, je souhaite rejoindre la séance "${session.title}" le ${session.dateLabel}`,
              );
              const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${message}`;
              Linking.openURL(whatsappUrl).catch((err) => {
                console.warn("Failed to open WhatsApp:", err);
              });
            }}
            activeOpacity={0.85}
            testID="session-contact-whatsapp"
          >
            <Text style={styles.whatsappButtonFullText}>
              Contacter via WhatsApp
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Purpose section already surfaces coachAdvice — skip duplicate note card. */}

        {/* Stitch pace-group override panel omitted — RSVP is the sticky dock. */}
        {session.paceGroups.length > 0 ? (
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
                              accessibilityRole="button"
                              accessibilityLabel={`Groupe ${group.label}`}
                              testID={`session-group-${group.id}`}
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


        {isCoachOrAdmin &&
        ((session.paceGroupsOverride ?? []).some((g) => g.isActive) ||
          session.paceGroups.length > 0) ? (
          <View style={styles.orgBlock} testID="session-org-block">
            <Text style={styles.orgLabel}>Organisation</Text>
            <Text style={styles.orgHint}>
              Assigne un groupe si besoin — discret, hors du récit de la sortie.
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
        ) : null}

        {/* Footer: delete only — Modifier lives in the slim header */}
        {isOrganizer ? (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.deleteLink}
              activeOpacity={0.7}
              onPress={() => setShowDeleteModal(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID="session-delete-btn"
              accessibilityRole="button"
              accessibilityLabel="Supprimer la séance"
            >
              <Text style={styles.deleteLinkText}>Supprimer la sortie</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        </>
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

      {!isOrganizer ? (
        <StitoStickyJoinBar
          joined={hasStoredJoin}
          busy={isJoiningOuting || isLeavingOuting}
          primaryLabel="Rejoindre la sortie"
          onPrimary={() => void handleSave()}
          onCancelParticipation={openLeaveConfirm}
        />
      ) : null}

      {/* M06 — cancel participation (not leave club) */}
      <Modal
        visible={showLeaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLeaveModal(false)}
          testID="session-leave-modal-dismiss"
        >
          <Pressable
            style={styles.leaveModalContent}
            onPress={(e) => e.stopPropagation()}
            testID="session-leave-confirm-modal"
            accessibilityViewIsModal
          >
            <Text style={styles.leaveModalTitle} testID="session-leave-modal-title">
              Tu ne viens plus ?
            </Text>
            <Text style={styles.leaveModalSubtitle}>
              {session.title}
              {session.dateLabel ? ` · ${session.dateLabel}` : ""}
            </Text>
            <View style={styles.leaveModalCard}>
              <Text style={styles.leaveModalCardTitle}>
                Annuler ta participation
              </Text>
              <Text style={styles.leaveModalCardBody}>
                Tu ne figureras plus parmi les participants à cette sortie.
              </Text>
              <Text style={styles.leaveModalCardBody}>
                Ton adhésion au club reste inchangée. Cette action ne quitte
                pas le club et ne supprime pas la sortie pour les autres.
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.leaveModalConfirmBtn,
                isLeavingOuting && { opacity: 0.6 },
              ]}
              onPress={() => void handleLeaveConfirm()}
              disabled={isLeavingOuting}
              accessibilityRole="button"
              accessibilityLabel="Confirmer l'annulation"
              testID="session-leave-confirm-btn"
            >
              <Text style={styles.leaveModalConfirmText}>
                {isLeavingOuting ? "Annulation…" : "Confirmer l'annulation"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.leaveModalKeepBtn}
              onPress={() => setShowLeaveModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Garder ma place"
              testID="session-leave-keep-btn"
            >
              <Text style={styles.leaveModalKeepText}>Garder ma place</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: stitoTheme.canvas,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 4,
    backgroundColor: stitoTheme.canvas,
  },
  headerContextRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginBottom: 4,
  },
  headerCityLabel: {
    fontFamily: stitoTheme.font.space.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: stitoTheme.outline,
  },
  headerAvatarMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: stitoTheme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarMarkText: {
    fontFamily: stitoTheme.font.space.bold,
    fontSize: 14,
    color: stitoTheme.onPrimary,
  },
  stitoHeroWrap: {
    marginBottom: 8,
  },
  stitoStory: {
    gap: 22,
    marginBottom: 20,
    paddingTop: 20,
  },
  stitoRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(190,202,190,0.45)",
  },
  orgBlock: {
    marginTop: 12,
    marginBottom: 8,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: stitoTheme.surfaceContainerHigh,
    gap: 8,
  },
  orgLabel: {
    fontFamily: stitoTheme.font.space.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: stitoTheme.outline,
  },
  orgHint: {
    fontFamily: stitoTheme.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: stitoTheme.textSecondary,
    marginBottom: 8,
  },
  deleteLink: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  deleteLinkText: {
    fontFamily: stitoTheme.font.space.semibold,
    fontSize: 14,
    color: stitoTheme.error,
  },
  headerNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  headerBackCircle: {
    width: 44,
    height: 44,
    marginLeft: -8,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBackChevron: {
    color: stitoTheme.text,
    fontSize: 28,
    fontWeight: "300",
    marginTop: -2,
  },
  headerLocation: {
    flex: 1,
    marginHorizontal: 8,
    fontFamily: stitoTheme.font.space.semibold,
    color: stitoTheme.text,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    textAlign: "left",
  },
  headerMenuDots: {
    color: stitoTheme.text,
    fontSize: 18,
    letterSpacing: 1,
    fontWeight: "700",
  },
  headerMenuAction: {
    fontFamily: stitoTheme.font.hanken.medium,
    color: stitoTheme.primary,
    fontSize: 12,
    lineHeight: 16,
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
    borderBottomColor: "rgba(190,202,190,0.85)",
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
    color: stitoTheme.textSecondary,
    marginBottom: 6,
    textAlign: "center",
  },
  tabLabelActive: {
    color: stitoTheme.text,
  },
  tabUnderline: {
    alignSelf: "stretch",
    height: 3,
    width: "100%",
    borderRadius: 2,
    backgroundColor: stitoTheme.primary,
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 140,
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
    fontSize: typography.sizes.md,
    marginTop: 8,
    lineHeight: 22,
  },
  inaccessibleBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  inaccessibleTitle: {
    color: colors.text.primary,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 36,
    marginBottom: 8,
  },
  inaccessibleCard: {
    marginTop: 22,
    marginBottom: 28,
    backgroundColor: colors.background.card,
    borderWidth: hairline,
    borderColor: colors.border.default,
    borderRadius: borderRadius.lg,
    padding: 18,
  },
  inaccessibleCardTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: "700",
    marginBottom: 8,
  },
  inaccessibleCardBody: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    lineHeight: 22,
  },
  inaccessiblePrimaryBtn: {
    backgroundColor: colors.accent.sage,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: "center",
  },
  inaccessiblePrimaryBtnText: {
    color: colors.accent.charcoal,
    fontSize: typography.sizes.md,
    fontWeight: "700",
  },
  secondaryLinkButton: {
    marginTop: 18,
    alignSelf: "center",
  },
  secondaryLinkButtonText: {
    color: colors.accent.sage,
    fontSize: typography.sizes.sm,
    fontWeight: "700",
    textAlign: "center",
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
    color: stitoTheme.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 4,
    fontFamily: stitoTheme.font.hanken.regular,
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
    color: stitoTheme.textSecondary,
    fontFamily: stitoTheme.font.hanken.regular,
    fontSize: 14,
  },
  infoValue: {
    color: stitoTheme.text,
    fontFamily: stitoTheme.font.space.semibold,
    fontSize: 14,
    fontWeight: "600",
  },
  infoLabelSmall: {
    color: stitoTheme.textSecondary,
    fontFamily: stitoTheme.font.hanken.regular,
    fontSize: 12,
    marginBottom: 4,
  },
  infoValueSmall: {
    color: stitoTheme.text,
    fontFamily: stitoTheme.font.hanken.medium,
    fontSize: 13,
    fontWeight: "500",
  },
  card: {
    backgroundColor: stitoTheme.card,
    borderRadius: stitoTheme.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.85)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
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
    color: stitoTheme.textSecondary,
    fontFamily: stitoTheme.font.space.bold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  cardSubtitle: {
    color: stitoTheme.textSecondary,
    fontFamily: stitoTheme.font.hanken.regular,
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
    backgroundColor: colors.accent.sage,
    paddingHorizontal: 24,
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modifyButtonText: {
    color: colors.accent.charcoal,
    fontSize: 15,
    fontWeight: "700",
  },
  deleteButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.card,
  },
  deleteButtonText: {
    color: colors.text.error,
    fontSize: 14,
    fontWeight: "600",
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
  leaveModalContent: {
    backgroundColor: colors.background.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: 24,
    width: "100%",
    maxWidth: 400,
    gap: 12,
  },
  leaveModalTitle: {
    color: colors.text.primary,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  leaveModalSubtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  leaveModalCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    borderWidth: hairline,
    borderColor: colors.border.default,
    padding: 16,
    gap: 8,
  },
  leaveModalCardTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  leaveModalCardBody: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  leaveModalSmall: {
    color: colors.text.tertiary,
    fontSize: 12,
    lineHeight: 16,
  },
  leaveModalConfirmBtn: {
    marginTop: 4,
    backgroundColor: colors.accent.sage,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  leaveModalConfirmText: {
    color: colors.accent.charcoal,
    fontSize: 16,
    fontWeight: "700",
  },
  leaveModalKeepBtn: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  leaveModalKeepText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  languageMeta: {
    marginTop: 10,
    color: colors.accent.sage,
    fontSize: 13,
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
