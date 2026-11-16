import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { stitoTheme as t } from "@/constants/stitoTheme";
import { clubInitialsFromName } from "@/lib/clubPaceGroups";
import { initialsFromName } from "@/lib/homeViewModel";
import type { Club, ClubRosterMember } from "@/types/api";

type ClubProfileStatus = "admin" | "member" | "pending";

type ClubProfileHubProps = {
  club: Club;
  status: ClubProfileStatus;
  roster: ClubRosterMember[];
  foundedYear?: string | null;
  /** e.g. Course · groupes couleur */
  activityLabel?: string | null;
  upcomingOutingCount?: number;
  /** When true, show full member list (capped); otherwise a compact strip. */
  expandedMembers?: boolean;
  onToggleMembers?: () => void;
};

const AVATAR_TONES = [t.primary, "#333E35", "#576158", "#1B4D3E"] as const;

function roleBadge(role: ClubRosterMember["role"]): string | null {
  if (role === "admin") return "Admin";
  if (role === "coach") return "Coach";
  return null;
}

function sortRoster(members: ClubRosterMember[]): ClubRosterMember[] {
  const rank = (role: ClubRosterMember["role"]) =>
    role === "admin" ? 0 : role === "coach" ? 1 : 2;
  return [...members].sort((a, b) => {
    const byRole = rank(a.role) - rank(b.role);
    if (byRole !== 0) return byRole;
    return (a.displayName ?? "").localeCompare(b.displayName ?? "", "fr");
  });
}

/**
 * Club “info” hub — WhatsApp-group utility, not WhatsApp chrome:
 * identity, about, facts, members, access — structured for pending + member.
 */
export function ClubProfileHub({
  club,
  status,
  roster,
  foundedYear,
  activityLabel,
  upcomingOutingCount = 0,
  expandedMembers = false,
  onToggleMembers,
}: ClubProfileHubProps) {
  const initials = clubInitialsFromName(club.name);
  const accessLabel =
    club.visibility === "members"
      ? "Sur invitation"
      : club.visibility === "public"
        ? "Ouvert"
        : null;
  const city = club.city?.trim() || null;
  const purpose = club.description?.trim() || null;
  const members = useMemo(() => sortRoster(roster), [roster]);
  const memberCount = members.length;
  const previewLimit = expandedMembers ? 24 : 6;
  const visible = members.slice(0, previewLimit);
  const hiddenCount = Math.max(0, memberCount - visible.length);

  const facts: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] =
    [];
  if (city) facts.push({ icon: "location-outline", label: "Ville", value: city });
  if (accessLabel)
    facts.push({ icon: "lock-closed-outline", label: "Accès", value: accessLabel });
  if (foundedYear)
    facts.push({ icon: "calendar-outline", label: "Fondé", value: foundedYear });
  if (activityLabel)
    facts.push({
      icon: "walk-outline",
      label: "Activité",
      value: activityLabel,
    });
  facts.push({
    icon: "people-outline",
    label: "Membres",
    value: memberCount > 0 ? String(memberCount) : "—",
  });
  facts.push({
    icon: "flag-outline",
    label: "Sorties à venir",
    value:
      upcomingOutingCount > 0
        ? String(upcomingOutingCount)
        : status === "pending"
          ? "Privées verrouillées"
          : "Aucune",
  });

  return (
    <View style={styles.wrap} testID="club-profile-hub">
      <View style={styles.identity} testID="club-overview-card">
        <View style={styles.monogram}>
          <Text style={styles.monogramText}>{initials}</Text>
        </View>
        <View style={styles.identityBody}>
          {(city || accessLabel) && (
            <Text style={styles.meta} numberOfLines={1}>
              {[city, accessLabel].filter(Boolean).join(" · ")}
            </Text>
          )}
          <Text style={styles.name} numberOfLines={2} testID="club-overview-name">
            {club.name}
          </Text>
        </View>
      </View>

      <View style={styles.section} testID="club-about-section">
        <Text style={styles.sectionLabel}>À PROPOS</Text>
        {purpose ? (
          <Text style={styles.purpose} testID="club-overview-purpose">
            {purpose}
          </Text>
        ) : (
          <Text
            style={styles.purposeMuted}
            testID="club-overview-purpose-empty"
          >
            Pas encore de description — le club n’a pas précisé son cadre.
          </Text>
        )}
      </View>

      <View style={styles.section} testID="club-facts-section">
        <Text style={styles.sectionLabel}>INFOS UTILES</Text>
        <View style={styles.factsGrid}>
          {facts.map((fact) => (
            <View key={fact.label} style={styles.factCell} testID={`club-fact-${fact.label}`}>
              <View style={styles.factIcon}>
                <Ionicons name={fact.icon} size={14} color={t.primary} />
              </View>
              <View style={styles.factText}>
                <Text style={styles.factLabel}>{fact.label}</Text>
                <Text style={styles.factValue} numberOfLines={2}>
                  {fact.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section} testID="club-members-section">
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>
            MEMBRES{memberCount > 0 ? ` · ${memberCount}` : ""}
          </Text>
          {memberCount > 6 && onToggleMembers ? (
            <Pressable
              onPress={onToggleMembers}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={
                expandedMembers ? "Réduire la liste" : "Voir tous les membres"
              }
              testID="club-members-toggle"
            >
              <Text style={styles.sectionLink}>
                {expandedMembers ? "Réduire" : "Tout voir"}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {memberCount === 0 ? (
          <Text style={styles.purposeMuted}>
            Les membres apparaîtront ici dès qu’ils sont confirmés.
          </Text>
        ) : (
          <View style={styles.memberList}>
            {visible.map((m, index) => {
              const name = m.displayName?.trim() || "Membre";
              const badge = roleBadge(m.role);
              const tone = AVATAR_TONES[index % AVATAR_TONES.length]!;
              return (
                <View
                  key={m.membershipId}
                  style={styles.memberRow}
                  testID={`club-member-row-${m.userId}`}
                >
                  <View style={[styles.memberAvatar, { backgroundColor: tone }]}>
                    <Text style={styles.memberAvatarText}>
                      {initialsFromName(name) || "·"}
                    </Text>
                  </View>
                  <View style={styles.memberBody}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {name}
                    </Text>
                    {badge ? (
                      <Text style={styles.memberRole}>{badge}</Text>
                    ) : (
                      <Text style={styles.memberRoleMuted}>Membre</Text>
                    )}
                  </View>
                </View>
              );
            })}
            {hiddenCount > 0 && !expandedMembers ? (
              <Text style={styles.moreMembers}>+{hiddenCount} autres</Text>
            ) : null}
          </View>
        )}
      </View>

      {status === "pending" ? (
        <Text style={styles.pendingNote} testID="club-access-note">
          En attente d’approbation — les sorties privées restent masquées.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    gap: 14,
  },
  identity: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  monogram: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: t.secondaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  monogramText: {
    color: t.onSecondaryContainer,
    fontSize: 17,
    fontFamily: t.font.space.bold,
    letterSpacing: 0.4,
  },
  identityBody: { flex: 1, minWidth: 0, gap: 4 },
  meta: {
    ...t.type.labelMd,
    color: t.textSecondary,
  },
  name: {
    ...t.type.cardTitleLg,
    fontSize: 24,
    lineHeight: 28,
    color: t.text,
  },
  section: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    padding: 16,
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionLabel: {
    ...t.type.labelSm,
    color: t.textSecondary,
    textTransform: "uppercase",
  },
  sectionLink: {
    fontFamily: t.font.space.semibold,
    fontSize: 13,
    color: t.primary,
  },
  purpose: {
    fontFamily: t.font.hanken.regular,
    fontSize: 15,
    lineHeight: 22,
    color: t.text,
  },
  purposeMuted: {
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.outline,
  },
  factsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  factCell: {
    width: "47%",
    flexGrow: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: t.surfaceContainerLow,
    borderRadius: 12,
    padding: 10,
  },
  factIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(0,95,52,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  factText: { flex: 1, minWidth: 0, gap: 1 },
  factLabel: {
    fontFamily: t.font.hanken.medium,
    fontSize: 11,
    color: t.outline,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  factValue: {
    fontFamily: t.font.space.semibold,
    fontSize: 14,
    color: t.text,
  },
  memberList: { gap: 10 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    color: t.onPrimary,
    fontFamily: t.font.hanken.semibold,
    fontSize: 12,
  },
  memberBody: { flex: 1, minWidth: 0 },
  memberName: {
    fontFamily: t.font.space.semibold,
    fontSize: 15,
    color: t.text,
  },
  memberRole: {
    fontFamily: t.font.hanken.medium,
    fontSize: 12,
    color: t.primary,
    marginTop: 1,
  },
  memberRoleMuted: {
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    color: t.outline,
    marginTop: 1,
  },
  moreMembers: {
    fontFamily: t.font.hanken.medium,
    fontSize: 13,
    color: t.textSecondary,
    marginTop: 2,
  },
  pendingNote: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.textSecondary,
    paddingHorizontal: 4,
  },
});
