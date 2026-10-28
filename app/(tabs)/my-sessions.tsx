import { router, useFocusEffect, useLocalSearchParams, type Href } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CancelParticipationModal } from "@/components/mesSorties/CancelParticipationModal";
import { stitoTheme as t } from "@/constants/stitoTheme";
import { createApiClient, getMySessions, leaveSession } from "@/lib/api";
import {
  getJoinedSessions,
  removeJoinedSession,
  type JoinedSession,
} from "@/lib/joinedSessionsStore";
import {
  clubOrHostLabel,
  disciplineMeta,
  distanceLabel,
  formatKmTotal,
  formatOutingDateCompact,
  formatOutingDateTime,
  isConfirmedParticipation,
  isPendingParticipation,
  locationLabel,
  paceLabel,
  sumPastDistanceKm,
  type MesSortiesTab,
} from "@/lib/mesSortiesViewModel";
import { setMesSortiesBadgeCount } from "@/lib/mesSortiesBadge";
import {
  activityLabel,
  discoveryDateParts,
  displayOutingTitle,
  formatTimeLabel,
  initialsFromName,
} from "@/lib/homeViewModel";
import { activityForSession } from "@/lib/experiences";
import {
  apiSessionToSessionData,
  getAllSessionsIncludingStored,
  type SessionData,
} from "@/lib/sessionData";
import { getSessionDateForSort } from "@/lib/sessionLogic";

const HOST_TONES = [t.primary, "#167A47", "#333E35", "#3F4941", "#005F34"] as const;

function hostTone(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % 97;
  return HOST_TONES[h % HOST_TONES.length]!;
}

function compactPaceLine(raw: string | null | undefined, walk: boolean): string {
  if (!raw || raw === "—" || /^0:00/i.test(raw)) return walk ? "Libre" : "Libre";
  return raw.replace(/^Allure\s+/i, "").replace(/\s*\/\s*km$/i, "").replace(/\/km\b/gi, "").trim() || "Libre";
}

function volumeBit(volume: string | undefined): string | null {
  const v = (volume ?? "").trim();
  if (!v) return null;
  const min = v.match(/(\d+)\s*min/i);
  if (min) return `${min[1]} min`;
  const hour = v.match(/(\d+)\s*h(?:\s*(\d+))?/i);
  if (hour) return hour[2] ? `${hour[1]}h${hour[2]}` : `${hour[1]} h`;
  // "14 km · endurance" is distance/format — not a duration
  const first = v.split("·")[0]?.trim() ?? "";
  if (!first || first.length > 18 || /\bkm\b/i.test(first)) return null;
  return first;
}

/**
 * Mes Sorties — Noa-Stito visual fidelity, real join/leave/API data.
 * Omits Stito prototype-only "Aperçu · Fiche d'annulation" chrome; real modal only.
 * Past counts/km from real sessions (not hardcoded 12 / fake May).
 */

function PulseDot({ color = t.primary }: { color?: string }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color,
        opacity,
      }}
    />
  );
}

function parseMesSortiesTab(raw: string | string[] | undefined): MesSortiesTab {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "past" || v === "passees" || v === "passées") return "past";
  if (v === "pending" || v === "attente") return "pending";
  return "upcoming";
}

export default function MySessionsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarInset = 54 + Math.max(insets.bottom, 10) + 12;
  const params = useLocalSearchParams<{ tab?: string }>();

  const [allSessions, setAllSessions] = useState<SessionData[]>([]);
  const [joinedSessions, setJoinedSessions] = useState<JoinedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<MesSortiesTab>(() =>
    parseMesSortiesTab(params.tab),
  );
  const [cancelTarget, setCancelTarget] = useState<SessionData | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (params.tab == null) return;
    setTab(parseMesSortiesTab(params.tab));
  }, [params.tab]);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      let sessions: SessionData[] = await getAllSessionsIncludingStored();
      try {
        const client = createApiClient();
        const apiResult = await getMySessions(client);
        const apiSessions = (apiResult.sessions ?? []).map(
          apiSessionToSessionData,
        );
        const ids = new Set(sessions.map((s) => s.id));
        for (const s of apiSessions) {
          if (!ids.has(s.id)) {
            sessions = [...sessions, s];
            ids.add(s.id);
          } else {
            sessions = sessions.map((x) => (x.id === s.id ? { ...x, ...s } : x));
          }
        }
      } catch (e) {
        console.warn("API my-sessions failed, using local only:", e);
      }
      const joined = await getJoinedSessions();
      const jids = new Set(joined.map((j) => j.sessionId));
      sessions = sessions.map((s) => {
        if (jids.has(s.id) && !s.attendanceStatus) {
          return { ...s, attendanceStatus: "joined" as const };
        }
        return s;
      });
      setAllSessions(sessions);
      setJoinedSessions(joined);
    } catch (e) {
      console.warn("Failed to load mes sorties:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const joinedIds = useMemo(
    () => new Set(joinedSessions.map((j) => j.sessionId)),
    [joinedSessions],
  );

  const pastCutoffMs = Date.now() - 15 * 60 * 1000;

  const personal = useMemo(() => {
    return allSessions.filter(
      (s) =>
        s.isCustom === true ||
        joinedIds.has(s.id) ||
        s.attendanceStatus === "suggested" ||
        s.attendanceStatus === "requested" ||
        s.attendanceStatus === "joined",
    );
  }, [allSessions, joinedIds]);

  const confirmedUpcoming = useMemo(() => {
    return personal
      .filter(
        (s) =>
          getSessionDateForSort(s) >= pastCutoffMs &&
          isConfirmedParticipation(s, joinedIds),
      )
      .sort((a, b) => getSessionDateForSort(a) - getSessionDateForSort(b));
  }, [personal, pastCutoffMs, joinedIds]);

  const pending = useMemo(() => {
    return personal
      .filter(
        (s) =>
          getSessionDateForSort(s) >= pastCutoffMs && isPendingParticipation(s),
      )
      .sort((a, b) => getSessionDateForSort(a) - getSessionDateForSort(b));
  }, [personal, pastCutoffMs]);

  const past = useMemo(() => {
    return personal
      .filter(
        (s) =>
          getSessionDateForSort(s) < pastCutoffMs &&
          (isConfirmedParticipation(s, joinedIds) || s.isCustom === true),
      )
      .sort((a, b) => getSessionDateForSort(b) - getSessionDateForSort(a));
  }, [personal, pastCutoffMs, joinedIds]);

  useEffect(() => {
    setMesSortiesBadgeCount(confirmedUpcoming.length);
  }, [confirmedUpcoming.length]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const openSession = (id: string) => {
    router.push(`/session/${id}` as Href);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelBusy(true);
    const id = cancelTarget.id;
    const title = cancelTarget.title;
    try {
      try {
        const client = createApiClient();
        await leaveSession(client, id);
      } catch (e) {
        console.warn("API leave failed, clearing local join:", e);
      }
      await removeJoinedSession(id);
      setAllSessions((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, attendanceStatus: null as SessionData["attendanceStatus"] }
            : s,
        ),
      );
      setJoinedSessions((prev) => prev.filter((j) => j.sessionId !== id));
      setToast(`Participation à « ${title} » annulée.`);
      setCancelTarget(null);
    } catch (e) {
      console.warn("Cancel failed:", e);
      setToast("Impossible d'annuler pour le moment.");
    } finally {
      setCancelBusy(false);
    }
  };

  const pastKm = sumPastDistanceKm(past);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="mes-sorties">
      {toast ? (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarInset + 16 },
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={t.primary}
          />
        }
      >
        <View style={styles.headerBlock}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>CALENDRIER PERSONNEL</Text>
            <Text style={styles.title} accessibilityRole="header">
              Mes Sorties & Réservations
            </Text>
          </View>

          <View style={styles.segment} accessibilityRole="tablist">
            {(
              [
                {
                  id: "upcoming" as const,
                  label: "À venir",
                  count: confirmedUpcoming.length,
                },
                {
                  id: "pending" as const,
                  label: "En attente",
                  count: pending.length,
                },
                {
                  id: "past" as const,
                  label: "Passées",
                  count: past.length,
                },
              ] as const
            ).map((item) => {
              const on = tab === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  onPress={() => setTab(item.id)}
                  style={[styles.segBtn, on && styles.segBtnOn]}
                  testID={`mes-sorties-tab-${item.id}`}
                >
                  <Text style={[styles.segLabel, on && styles.segLabelOn]}>
                    {item.label}
                  </Text>
                  <View
                    style={[
                      styles.segBadge,
                      on ? styles.segBadgeOn : styles.segBadgeOff,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segBadgeText,
                        on && styles.segBadgeTextOn,
                      ]}
                    >
                      {item.count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {tab === "upcoming" ? (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionHeadLeft}>
                <PulseDot />
                <Text style={styles.sectionTitle}>Sorties confirmées</Text>
              </View>
              <Text style={styles.sectionMeta}>
                {confirmedUpcoming.length} réservation
                {confirmedUpcoming.length === 1 ? "" : "s"} active
                {confirmedUpcoming.length === 1 ? "" : "s"}
              </Text>
            </View>

            {loading && !confirmedUpcoming.length && !pending.length ? (
              <Text style={styles.loadingHint}>Chargement…</Text>
            ) : confirmedUpcoming.length ? (
              <View style={styles.grid}>
                {confirmedUpcoming.map((s) => (
                  <ConfirmedCard
                    key={s.id}
                    session={s}
                    onDetails={() => openSession(s.id)}
                    onCancel={() => setCancelTarget(s)}
                  />
                ))}
              </View>
            ) : (
              <EmptyUpcoming
                onExplore={() => router.push("/" as Href)}
                pastCount={past.length}
                onOpenPast={() => setTab("past")}
              />
            )}

            {past.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Voir ${past.length} sorties passées`}
                onPress={() => setTab("past")}
                style={({ pressed }) => [
                  styles.pastTeaser,
                  pressed && { opacity: 0.9 },
                ]}
                testID="mes-sorties-past-teaser"
              >
                <View style={styles.pastTeaserLeft}>
                  <Ionicons name="time-outline" size={18} color={t.primary} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.pastTeaserTitle}>
                      Sorties passées
                    </Text>
                    <Text style={styles.pastTeaserBody} numberOfLines={1}>
                      {past.length} sortie{past.length === 1 ? "" : "s"} ·{" "}
                      {formatKmTotal(pastKm)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.pastTeaserCta}>Voir →</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {(tab === "pending" || (tab === "upcoming" && pending.length > 0)) && (
          <View style={[styles.section, tab === "upcoming" && { paddingTop: 8 }]}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionHeadLeft}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: t.secondaryFixedDim,
                  }}
                />
                <Text style={styles.sectionTitle}>Demandes en attente</Text>
              </View>
              <Text style={styles.sectionMeta}>
                {pending.length} requête{pending.length === 1 ? "" : "s"} en cours
              </Text>
            </View>
            {pending.length ? (
              <View style={styles.grid}>
                {pending.map((s) => (
                  <PendingCard
                    key={s.id}
                    session={s}
                    onCancel={() => setCancelTarget(s)}
                  />
                ))}
              </View>
            ) : tab === "pending" ? (
              <View style={styles.emptyCompact}>
                <Text style={styles.emptyTitle}>Aucune demande en attente</Text>
                <Text style={styles.emptyBody}>
                  Les sorties sur invitation apparaîtront ici jusqu’à validation.
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {tab === "past" ? (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionHeadLeft}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: t.outline,
                  }}
                />
                <Text style={styles.sectionTitle}>
                  Sorties passées ({past.length})
                </Text>
              </View>
              <Text style={[styles.sectionMeta, { color: t.outline }]}>
                Total {formatKmTotal(pastKm)}
              </Text>
            </View>
            {past.length ? (
              <View style={styles.pastGrid}>
                {past.map((s) => (
                  <PastCard
                    key={s.id}
                    session={s}
                    onPress={() => openSession(s.id)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyCompact}>
                <Text style={styles.emptyTitle}>Pas encore de sorties passées</Text>
                <Text style={styles.emptyBody}>
                  Tes sorties terminées s’afficheront ici avec distance et allure.
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>

      <CancelParticipationModal
        visible={Boolean(cancelTarget)}
        title={cancelTarget?.title ?? ""}
        busy={cancelBusy}
        onConfirm={() => void confirmCancel()}
        onKeep={() => setCancelTarget(null)}
      />
    </View>
  );
}

function ConfirmedCard({
  session,
  onDetails,
  onCancel,
}: {
  session: SessionData;
  onDetails: () => void;
  onCancel: () => void;
}) {
  const host = clubOrHostLabel(session);
  const isWalk = activityForSession(session) === "walk";
  const activity = activityLabel(session);
  const title = displayOutingTitle(session.title);
  const date = discoveryDateParts(session);
  const time = formatTimeLabel(session.timeMinutes);
  const dist = distanceLabel(session);
  const pace = compactPaceLine(paceLabel(session), isWalk);
  const dur = volumeBit(session.volume);
  const initials = initialsFromName(host) || (isWalk ? "M" : "C");
  const tone = hostTone(host);

  return (
    <View style={styles.card} testID={`mes-sorties-confirmed-${session.id}`}>
      <View style={styles.liveRow}>
        <View style={styles.dateRail} accessibilityLabel={formatOutingDateCompact(session)}>
          <Text style={styles.dateWeekday}>{date?.weekday ?? "—"}</Text>
          <Text style={styles.dateDay}>{date?.dayNum ?? "·"}</Text>
          <Text style={styles.dateMonth}>{date?.month ?? ""}</Text>
        </View>

        <View style={styles.liveBody}>
          <View style={styles.hostRow}>
            <View style={[styles.hostAvatar, { backgroundColor: tone }]}>
              <Text style={styles.hostAvatarText}>{initials}</Text>
            </View>
            <View style={styles.hostTextCol}>
              <Text style={styles.hostName} numberOfLines={1}>
                {host}
              </Text>
              <View style={styles.chipRow}>
                <View style={[styles.actChip, isWalk ? styles.actChipWalk : styles.actChipRun]}>
                  <Text
                    style={[
                      styles.actChipText,
                      isWalk ? styles.actChipTextWalk : styles.actChipTextRun,
                    ]}
                  >
                    {activity}
                  </Text>
                </View>
                <View style={styles.inscritPill}>
                  <Ionicons
                    name="checkmark-circle"
                    size={13}
                    color={t.onSecondaryContainer}
                  />
                  <Text style={styles.inscritText}>Inscrit</Text>
                </View>
              </View>
            </View>
            {time ? (
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>{time}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.spotLine} numberOfLines={1}>
            {locationLabel(session) || "Lieu à préciser"}
          </Text>

          <View style={styles.metricStrip}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Distance</Text>
              <Text style={styles.metricValue} numberOfLines={1}>
                {dist ?? "—"}
              </Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>{isWalk ? "Rythme" : "Allure"}</Text>
              <Text
                style={[styles.metricValue, pace.length > 10 && styles.metricValueTight]}
                numberOfLines={1}
              >
                {pace}
              </Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Durée</Text>
              <Text style={styles.metricValue} numberOfLines={1}>
                {dur ?? "—"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Annuler ma participation"
          onPress={onCancel}
          style={({ pressed }) => [
            styles.desistBtn,
            pressed && { opacity: 0.75 },
          ]}
          testID={`mes-sorties-desist-${session.id}`}
        >
          <Text style={styles.desistText}>Annuler</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voir les détails"
          onPress={onDetails}
          style={({ pressed }) => [
            styles.detailsBtn,
            pressed && { opacity: 0.9 },
          ]}
          testID={`mes-sorties-details-${session.id}`}
        >
          <Text style={styles.detailsText}>Détails</Text>
          <Ionicons name="arrow-forward" size={16} color={t.text} />
        </Pressable>
      </View>
    </View>
  );
}

function PendingCard({
  session,
  onCancel,
}: {
  session: SessionData;
  onCancel: () => void;
}) {
  return (
    <View style={styles.card} testID={`mes-sorties-pending-${session.id}`}>
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <View style={styles.metaRow}>
            <Text style={[styles.clubLabel, { color: t.textSecondary }]} numberOfLines={1}>
              {clubOrHostLabel(session)}
            </Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.discipline}>{disciplineMeta(session)}</Text>
          </View>
          <Text style={[styles.cardTitle, { fontSize: 16 }]} numberOfLines={2}>
            {session.title}
          </Text>
        </View>
        <View style={styles.pendingPill}>
          <Ionicons name="hourglass-outline" size={14} color={t.textSecondary} />
          <Text style={styles.pendingText}>En attente</Text>
        </View>
      </View>

      <View style={styles.pendingBox}>
        <View style={styles.pendingBoxRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
            <Ionicons name="calendar-outline" size={18} color={t.primary} />
            <Text style={styles.pendingWhen} numberOfLines={1}>
              {formatOutingDateTime(session)}
            </Text>
          </View>
          <Text style={styles.pendingLoc} numberOfLines={1}>
            {locationLabel(session)}
          </Text>
        </View>
        <View style={styles.pendingInfoRow}>
          <Ionicons name="information-circle-outline" size={16} color={t.textSecondary} />
          <Text style={styles.pendingInfo}>
            L'organisateur valide les participants avant le départ afin de calibrer
            le groupe.
          </Text>
        </View>
      </View>

      <View style={styles.pendingActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Annuler ma demande"
          onPress={onCancel}
          hitSlop={8}
          style={({ pressed }) => [pressed && { opacity: 0.75 }]}
        >
          <Text style={styles.cancelRequest}>Annuler ma demande</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PastCard({
  session,
  onPress,
}: {
  session: SessionData;
  onPress: () => void;
}) {
  const host = clubOrHostLabel(session);
  const isWalk = activityForSession(session) === "walk";
  const activity = activityLabel(session);
  const title = displayOutingTitle(session.title);
  const date = discoveryDateParts(session);
  const time = formatTimeLabel(session.timeMinutes);
  const dist = distanceLabel(session);
  const pace = compactPaceLine(paceLabel(session), isWalk);
  const loc = locationLabel(session);
  const dur = volumeBit(session.volume);
  const initials = initialsFromName(host) || (isWalk ? "M" : "C");
  const tone = hostTone(host);
  const evening = (session.timeMinutes ?? 0) >= 16 * 60;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${formatOutingDateCompact(session)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pastCard,
        isWalk && styles.pastCardWalk,
        evening && !isWalk && styles.pastCardEvening,
        pressed && { opacity: 0.92 },
      ]}
      testID={`mes-sorties-past-${session.id}`}
    >
      <View style={styles.liveRow}>
        <View
          style={[
            styles.dateRail,
            styles.dateRailPast,
            evening && styles.dateRailEvening,
          ]}
        >
          <Text
            style={[
              styles.dateWeekday,
              evening && styles.dateWeekdayEvening,
            ]}
          >
            {date?.weekday ?? "—"}
          </Text>
          <Text style={[styles.dateDay, styles.dateDayPast]}>
            {date?.dayNum ?? "·"}
          </Text>
          <Text style={styles.dateMonth}>{date?.month ?? ""}</Text>
        </View>

        <View style={styles.liveBody}>
          <View style={styles.hostRow}>
            <View style={[styles.hostAvatar, styles.hostAvatarPast, { backgroundColor: tone }]}>
              <Text style={styles.hostAvatarText}>{initials}</Text>
            </View>
            <View style={styles.hostTextCol}>
              <Text style={styles.hostName} numberOfLines={1}>
                {host}
              </Text>
              <View style={styles.chipRow}>
                <View style={[styles.actChip, isWalk ? styles.actChipWalk : styles.actChipRun]}>
                  <Text
                    style={[
                      styles.actChipText,
                      isWalk ? styles.actChipTextWalk : styles.actChipTextRun,
                    ]}
                  >
                    {activity}
                  </Text>
                </View>
                {time ? (
                  <View style={[styles.timeBadge, styles.timeBadgePast]}>
                    <Text style={styles.timeBadgeText}>{time}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <View style={styles.doneMark} accessibilityLabel="Terminée">
              <Ionicons name="checkmark-circle" size={22} color={t.primary} />
            </View>
          </View>

          <Text style={styles.pastTitle} numberOfLines={2}>
            {title}
          </Text>
          {loc ? (
            <Text style={styles.spotLine} numberOfLines={1}>
              {loc}
            </Text>
          ) : null}

          <View style={styles.metricStrip}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Distance</Text>
              <Text style={styles.metricValueStrong} numberOfLines={1}>
                {dist ?? "—"}
              </Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>{isWalk ? "Rythme" : "Allure"}</Text>
              <Text
                style={[styles.metricValue, pace.length > 10 && styles.metricValueTight]}
                numberOfLines={1}
              >
                {pace}
              </Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Durée</Text>
              <Text style={styles.metricValue} numberOfLines={1}>
                {dur ?? "—"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function EmptyUpcoming({
  onExplore,
  pastCount = 0,
  onOpenPast,
}: {
  onExplore: () => void;
  pastCount?: number;
  onOpenPast?: () => void;
}) {
  return (
    <View style={styles.empty} testID="mes-sorties-empty-upcoming">
      <View style={styles.emptyIcon}>
        <Ionicons name="walk-outline" size={28} color={t.primary} />
      </View>
      <Text style={styles.emptyTitle}>Aucune sortie prévue pour le moment</Text>
      <Text style={styles.emptyBody}>
        Trouve un groupe chaleureux pour marcher ou courir ensemble ce week-end.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Explorer les sorties"
        onPress={onExplore}
        style={({ pressed }) => [
          styles.exploreBtn,
          pressed && { opacity: 0.9 },
        ]}
        testID="mes-sorties-explore"
      >
        <Ionicons name="compass-outline" size={18} color={t.onPrimary} />
        <Text style={styles.exploreText}>Explorer les sorties</Text>
      </Pressable>
      {pastCount > 0 && onOpenPast ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voir les sorties passées"
          onPress={onOpenPast}
          style={styles.emptyPastLink}
          testID="mes-sorties-empty-past-link"
        >
          <Text style={styles.emptyPastLinkText}>
            Ou revoir tes {pastCount} sortie{pastCount === 1 ? "" : "s"} passée
            {pastCount === 1 ? "" : "s"} →
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: t.canvas },
  content: {
    paddingHorizontal: t.space.lg,
    paddingTop: t.space.md,
    gap: t.space.xl,
    maxWidth: 960,
    width: "100%",
    alignSelf: "center",
  },
  toast: {
    position: "absolute",
    top: 56,
    alignSelf: "center",
    zIndex: 50,
    backgroundColor: t.text,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: t.radiusChip,
    maxWidth: "90%",
  },
  toastText: {
    ...t.type.labelMd,
    color: t.canvas,
    fontFamily: t.font.space.semibold,
  },
  headerBlock: {
    gap: t.space.lg,
    paddingBottom: t.space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(232,232,233,0.9)",
  },
  headerText: { gap: 2 },
  eyebrow: {
    ...t.type.labelSm,
    color: t.outline,
    textTransform: "uppercase",
  },
  title: { ...t.type.pageTitle, color: t.text },
  segment: {
    flexDirection: "row",
    backgroundColor: t.surfaceContainerHigh,
    borderRadius: t.radiusChip,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.7)",
    gap: 2,
  },
  segBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: t.radiusChip,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  segBtnOn: {
    backgroundColor: t.surfaceContainerLowest,
  },
  segLabel: {
    ...t.type.labelMd,
    color: t.textSecondary,
    fontFamily: t.font.space.semibold,
  },
  segLabelOn: {
    color: t.primary,
    fontFamily: t.font.space.bold,
  },
  segBadge: {
    minWidth: 18,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: t.radiusChip,
  },
  segBadgeOn: {
    backgroundColor: t.secondaryContainer,
  },
  segBadgeOff: {
    backgroundColor: t.surfaceContainerHighest,
  },
  segBadgeText: {
    ...t.type.labelSm,
    color: t.textSecondary,
    textAlign: "center",
  },
  segBadgeTextOn: {
    color: t.onSecondaryContainer,
  },
  section: { gap: t.space.md },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sectionHeadLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  sectionTitle: { ...t.type.section, color: t.text, flexShrink: 1 },
  sectionMeta: {
    ...t.type.labelSm,
    color: t.textSecondary,
    textTransform: "uppercase",
    fontFamily: t.font.space.semibold,
  },
  loadingHint: { ...t.type.bodySm, color: t.textSecondary },
  grid: { gap: t.space.md },
  pastGrid: { gap: t.space.md },
  pastTeaser: {
    marginTop: t.space.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: t.card,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
  },
  pastTeaserLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  pastTeaserTitle: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: t.text,
  },
  pastTeaserBody: {
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.outline,
    marginTop: 2,
  },
  pastTeaserCta: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 13,
    color: t.primary,
  },
  emptyPastLink: {
    marginTop: 14,
    paddingVertical: 8,
  },
  emptyPastLinkText: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: t.primary,
    textAlign: "center",
  },
  card: {
    backgroundColor: t.surfaceContainerLowest,
    borderRadius: t.radiusMain,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.75)",
    shadowColor: "#1A1C1D",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  liveRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  dateRail: {
    width: 52,
    borderRadius: 14,
    backgroundColor: "rgba(0,95,52,0.1)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 2,
  },
  dateRailPast: {
    backgroundColor: "rgba(0,95,52,0.08)",
  },
  dateRailEvening: {
    backgroundColor: "rgba(51,62,53,0.12)",
  },
  dateWeekday: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 11,
    lineHeight: 14,
    color: t.primary,
    textTransform: "uppercase",
  },
  dateWeekdayEvening: {
    color: "#333E35",
  },
  dateDay: {
    fontFamily: t.font.space.bold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.6,
    color: t.primary,
    fontVariant: ["tabular-nums"],
  },
  dateDayPast: {
    color: t.text,
  },
  dateMonth: {
    fontFamily: t.font.hanken.medium,
    fontSize: 11,
    lineHeight: 14,
    color: t.outline,
  },
  liveBody: { flex: 1, minWidth: 0, gap: 8 },
  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  hostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  hostAvatarPast: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  hostAvatarText: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 12,
    color: t.onPrimary,
  },
  hostTextCol: { flex: 1, minWidth: 0, gap: 4 },
  hostName: {
    fontFamily: t.font.space.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: t.text,
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  actChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  actChipRun: { backgroundColor: "rgba(0,95,52,0.1)" },
  actChipWalk: { backgroundColor: "rgba(63,73,65,0.12)" },
  actChipText: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 11,
    lineHeight: 14,
  },
  actChipTextRun: { color: t.primary },
  actChipTextWalk: { color: t.textSecondary },
  timeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(0,95,52,0.1)",
    minWidth: 52,
    alignItems: "center",
  },
  timeBadgePast: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 48,
  },
  timeBadgeText: {
    fontFamily: t.font.space.bold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.2,
    color: t.primary,
    fontVariant: ["tabular-nums"],
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTopLeft: { flex: 1, minWidth: 0, gap: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  clubLabel: {
    ...t.type.labelSm,
    color: t.primary,
    textTransform: "uppercase",
    flexShrink: 1,
  },
  dot: { ...t.type.labelSm, color: t.textSecondary },
  discipline: {
    ...t.type.labelSm,
    color: t.textSecondary,
    fontFamily: t.font.space.semibold,
  },
  cardTitle: {
    fontFamily: t.font.space.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: t.text,
  },
  spotLine: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.textSecondary,
    marginTop: -2,
  },
  metricStrip: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: t.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricCol: { flex: 1, minWidth: 0, gap: 2 },
  metricLabel: {
    fontFamily: t.font.hanken.medium,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: t.outline,
  },
  metricValue: {
    fontFamily: t.font.space.semibold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.2,
    color: t.text,
  },
  metricValueTight: { fontSize: 12, lineHeight: 16 },
  metricValueStrong: {
    fontFamily: t.font.space.bold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.3,
    color: t.primary,
  },
  inscritPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(118,252,167,0.45)",
  },
  inscritText: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 11,
    lineHeight: 14,
    color: t.onSecondaryContainer,
  },
  pendingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: t.radiusChip,
    backgroundColor: t.surfaceContainerHigh,
  },
  pendingText: { ...t.type.labelSm, color: t.textSecondary },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(232,232,233,0.9)",
    paddingTop: 12,
  },
  desistBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: t.touchMin,
    paddingRight: 8,
  },
  desistText: {
    ...t.type.labelMd,
    color: t.textSecondary,
    fontFamily: t.font.space.semibold,
  },
  detailsBtn: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: t.surfaceContainer,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailsText: {
    ...t.type.labelMd,
    color: t.text,
    fontFamily: t.font.space.bold,
  },
  pendingBox: {
    backgroundColor: t.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  pendingBoxRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  pendingWhen: {
    ...t.type.labelMd,
    color: t.text,
    fontFamily: t.font.space.bold,
    flexShrink: 1,
  },
  pendingLoc: { ...t.type.labelSm, color: t.textSecondary, flexShrink: 1 },
  pendingInfoRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  pendingInfo: { ...t.type.bodySm, color: t.textSecondary, flex: 1, fontSize: 12 },
  pendingActions: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(232,232,233,0.9)",
    paddingTop: 10,
    alignItems: "flex-end",
  },
  cancelRequest: {
    ...t.type.labelMd,
    color: t.textSecondary,
    fontFamily: t.font.space.medium,
    minHeight: t.touchMin,
    textAlignVertical: "center",
    paddingVertical: 10,
  },
  pastCard: {
    backgroundColor: t.surfaceContainerLowest,
    borderRadius: t.radiusMain,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.75)",
    borderLeftWidth: 3,
    borderLeftColor: t.secondaryFixedDim,
    shadowColor: "#1A1C1D",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pastCardWalk: {
    borderLeftColor: "#576158",
  },
  pastCardEvening: {
    borderLeftColor: t.primary,
  },
  pastTitle: {
    fontFamily: t.font.space.bold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.3,
    color: t.text,
  },
  doneMark: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    backgroundColor: t.surfaceContainerLow,
    borderRadius: t.radiusMain,
    padding: 32,
    alignItems: "center",
    gap: 12,
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
  },
  emptyCompact: {
    backgroundColor: t.surfaceContainerLow,
    borderRadius: t.radiusMain,
    padding: 24,
    gap: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: t.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    ...t.type.section,
    color: t.text,
    textAlign: "center",
    fontSize: 18,
  },
  emptyBody: {
    ...t.type.bodySm,
    color: t.textSecondary,
    textAlign: "center",
  },
  exploreBtn: {
    marginTop: 8,
    minHeight: 44,
    paddingHorizontal: 24,
    borderRadius: t.radiusChip,
    backgroundColor: t.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exploreText: {
    ...t.type.labelMd,
    color: t.onPrimary,
    fontFamily: t.font.space.bold,
    fontSize: 14,
  },
});
