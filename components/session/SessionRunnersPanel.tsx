import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { borderRadius, colors, hairline } from "@/constants/ui";
import type {
  AttendanceStatus,
  SessionParticipantsGroupId,
  SessionParticipantsResult,
} from "@/types/api";

export type RunnersFilter = "all" | "joined" | "suggested" | "requested";

export type SessionRunnersPanelProps = {
  loading: boolean;
  error: "forbidden" | "unavailable" | null;
  data: SessionParticipantsResult | null;
  filter: RunnersFilter;
  onFilter: (f: RunnersFilter) => void;
  noGroupOnly: boolean;
  onToggleNoGroup: () => void;
  /** @deprecated Card styling is unified; kept for call-site compatibility */
  variant?: "tab" | "standalone";
  onGoToClub?: () => void;
  onRequestAccess?: () => void;
};

function statusLabel(st: AttendanceStatus): string | null {
  if (st === "suggested") return "PROPOSÉ";
  if (st === "requested" || st === "waitlisted") return "EN ATTENTE";
  if (st === "joined") return null;
  if (st === "declined" || st === "left") return "HORS";
  return null;
}

function matchesFilter(
  st: AttendanceStatus,
  filter: RunnersFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "joined") return st === "joined";
  if (filter === "suggested") return st === "suggested";
  if (filter === "requested")
    return st === "requested" || st === "waitlisted";
  return true;
}

function shortGroupTitle(groupId: SessionParticipantsGroupId): string {
  if (groupId == null) return "Sans groupe";
  return `Groupe ${groupId}`;
}

function RunnerStatusTag({ tag }: { tag: string }) {
  if (tag === "PROPOSÉ") {
    return <Text style={styles.statusProposed}>{tag}</Text>;
  }
  if (tag === "EN ATTENTE") {
    return (
      <View style={styles.statusWaitBadge}>
        <Text style={styles.statusWaitTxt}>{tag}</Text>
      </View>
    );
  }
  return (
    <View style={styles.miniPill}>
      <Text style={styles.miniPillTxt}>{tag}</Text>
    </View>
  );
}

export function SessionRunnersPanel({
  loading,
  error,
  data,
  filter,
  onFilter,
  noGroupOnly,
  onToggleNoGroup,
  onGoToClub,
  onRequestAccess,
}: SessionRunnersPanelProps) {
  const chips: { id: RunnersFilter; label: string }[] = [
    { id: "all", label: "Tous" },
    { id: "joined", label: "Confirmés" },
    { id: "suggested", label: "Proposés" },
    { id: "requested", label: "En attente" },
  ];

  const filteredGroups = useMemo(() => {
    if (!data) return [];
    const order: SessionParticipantsGroupId[] = ["A", "B", "C", "D", null];
    const byId = new Map(data.groups.map((g) => [String(g.groupId), g]));
    return order
      .map((groupId) => {
        const gr = byId.get(String(groupId));
        if (!gr) return null;
        const parts = gr.participants.filter((p) => {
          if (noGroupOnly && p.groupId !== null) return false;
          return matchesFilter(p.status, filter);
        });
        return { ...gr, participants: parts, count: parts.length };
      })
      .filter((g): g is NonNullable<typeof g> => g != null && g.count > 0);
  }, [data, filter, noGroupOnly]);

  const filterEmpty = data && !loading && !error && filteredGroups.length === 0;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>RUNNERS</Text>
      <Text style={styles.legend}>
        Confirmés = participent · En attente = demande envoyée · Proposés =
        suggestion coach
      </Text>

      {loading ? (
        <ActivityIndicator
          style={{ marginVertical: 16 }}
          color={colors.accent.primary}
        />
      ) : error === "forbidden" ? (
        <View style={styles.blockedWrap}>
          <Text style={styles.hint}>
            Réservé aux membres du club. Rejoins le club pour voir les runners.
          </Text>
          {onRequestAccess ? (
            <Pressable style={styles.ctaBtn} onPress={onRequestAccess}>
              <Text style={styles.ctaBtnTxt}>Demander l&apos;accès</Text>
            </Pressable>
          ) : null}
          {onGoToClub ? (
            <Pressable style={styles.ctaBtnOutline} onPress={onGoToClub}>
              <Text style={styles.ctaBtnOutlineTxt}>Ouvrir le club</Text>
            </Pressable>
          ) : null}
        </View>
      ) : error === "unavailable" ? (
        <Text style={styles.hint}>Liste indisponible hors ligne.</Text>
      ) : data ? (
        <>
          <View style={styles.pillRow}>
            <View style={[styles.pill, styles.pillTotal]}>
              <Text style={styles.pillTxtTotal}>{data.counts.total} TOTAL</Text>
            </View>
            <View style={[styles.pill, styles.pillGreen]}>
              <Text style={styles.pillTxtGreen}>
                {data.counts.joined} CONFIRMÉS
              </Text>
            </View>
            <View style={[styles.pill, styles.pillOrange]}>
              <Text style={styles.pillTxtOrange}>
                {data.counts.suggested} PROPOSÉS
              </Text>
            </View>
            <View style={[styles.pill, styles.pillGrey]}>
              <Text style={styles.pillTxtGrey}>
                {data.counts.requested} EN ATTENTE
              </Text>
            </View>
          </View>

          <View style={styles.chipRow}>
            {chips.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => onFilter(c.id)}
                style={[styles.chip, filter === c.id && styles.chipOn]}
              >
                <Text
                  style={[
                    styles.chipTxt,
                    filter === c.id && styles.chipTxtOn,
                  ]}
                >
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={onToggleNoGroup} style={styles.linkRow}>
            <Text style={styles.link}>
              {noGroupOnly
                ? "Afficher tous les groupes"
                : "Voir seulement sans groupe"}
            </Text>
          </Pressable>

          {filterEmpty ? (
            <Text style={styles.filterEmptyHint}>
              Aucun runner pour ce filtre. Essaie « Tous » ou un autre statut.
            </Text>
          ) : (
            <View style={styles.groupList}>
              {filteredGroups.map((gr) => (
                <View key={String(gr.groupId)} style={styles.groupCard}>
                  <View style={styles.groupHead}>
                    <Text style={styles.groupTitle}>
                      {shortGroupTitle(gr.groupId)}
                    </Text>
                    <Text style={styles.groupCount}>{gr.count}</Text>
                  </View>
                  {gr.participants.map((p) => {
                    const tag = statusLabel(p.status);
                    return (
                      <View key={p.userId} style={styles.nameRow}>
                        <Text style={styles.name}>{p.displayName}</Text>
                        {tag ? <RunnerStatusTag tag={tag} /> : null}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <Text style={styles.hint}>Aucune donnée.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 14,
    borderWidth: hairline,
    borderColor: colors.border.default,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  legend: {
    color: colors.text.secondary,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  hint: { color: colors.text.secondary, fontSize: 13, marginVertical: 8 },
  blockedWrap: { gap: 10, marginVertical: 8 },
  ctaBtn: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  ctaBtnTxt: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  ctaBtnOutline: {
    borderRadius: borderRadius.md,
    borderWidth: hairline,
    borderColor: colors.accent.primary,
    paddingVertical: 12,
    alignItems: "center",
  },
  ctaBtnOutlineTxt: {
    color: colors.accent.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  filterEmptyHint: {
    color: colors.text.secondary,
    fontSize: 13,
    marginTop: 14,
    textAlign: "center",
    lineHeight: 18,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
  },
  pillTotal: { backgroundColor: colors.accent.primary },
  pillGreen: { backgroundColor: colors.tag.greenBg },
  pillOrange: { backgroundColor: colors.accent.orangeDim },
  pillGrey: { backgroundColor: colors.surface.s3 },
  pillTxtTotal: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pillTxtGreen: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.tag.greenText,
  },
  pillTxtOrange: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accent.orange,
  },
  pillTxtGrey: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text.secondary,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.pill,
    borderWidth: hairline,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "transparent",
  },
  chipOn: {
    borderColor: colors.border.default,
    backgroundColor: colors.surface.s3,
  },
  chipTxt: { color: colors.text.secondary, fontSize: 13, fontWeight: "600" },
  chipTxtOn: { color: colors.text.primary, fontWeight: "600" },
  linkRow: { marginTop: 6 },
  link: { color: colors.accent.primary, fontSize: 14, fontWeight: "600" },
  groupList: { marginTop: 12, gap: 10 },
  groupCard: {
    backgroundColor: colors.surface.s3,
    borderRadius: 12,
    padding: 12,
  },
  groupHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  groupTitle: { color: colors.text.primary, fontSize: 15, fontWeight: "700" },
  groupCount: { color: colors.text.secondary, fontSize: 14 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  name: { color: colors.text.primary, fontSize: 14, flex: 1, paddingRight: 8 },
  statusProposed: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text.secondary,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  statusWaitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.accent.orangeDim,
  },
  statusWaitTxt: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.accent.orange,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  miniPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.surface.s4,
  },
  miniPillTxt: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text.secondary,
  },
});
