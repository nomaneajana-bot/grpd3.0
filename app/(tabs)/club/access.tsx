import { type Href, router, Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { Toast } from "@/components/ui/Toast";
import { stitoTheme as t } from "@/constants/stitoTheme";
import { useToast } from "@/hooks/useToast";
import {
  createApiClient,
  createClubInvite,
  getMyMemberships,
  joinClubByCode,
  requestClubJoinBySlug,
} from "@/lib/api";
import type { ClubMembership } from "@/types/api";

export default function ClubAccessScreen() {
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [generatedInviteCode, setGeneratedInviteCode] = useState<string | null>(
    null,
  );
  const [clubSlug, setClubSlug] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [inviteClubId, setInviteClubId] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const loadMemberships = useCallback(async () => {
    setIsLoading(true);
    try {
      const client = createApiClient();
      const result = await getMyMemberships(client);
      setMemberships(result.memberships ?? []);
    } catch (error) {
      console.warn("Failed to load memberships:", error);
      setMemberships([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemberships();
  }, [loadMemberships]);

  const approvedMemberships = memberships.filter((m) => m.status === "approved");
  const adminMemberships = approvedMemberships.filter(
    (m) => m.role === "admin" || m.role === "coach",
  );
  /** Prefer explicitly selected admin club, else first admin club (multi-club safe). */
  const adminMembership =
    adminMemberships.find((m) => m.clubId === inviteClubId) ??
    adminMemberships[0] ??
    null;
  const primaryMembership =
    adminMembership ??
    approvedMemberships[0] ??
    memberships.find((m) => m.status === "pending") ??
    null;
  const isApprovedMember = primaryMembership?.status === "approved";
  const isPendingMember = primaryMembership?.status === "pending";
  const isCoachOrAdmin = Boolean(adminMembership);

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) {
      showToast("Ajoute un code d'invitation.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const client = createApiClient();
      await joinClubByCode(client, { code: inviteCode.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Bienvenue ! Tu as rejoint le club.", "success");
      setInviteCode("");
      await loadMemberships();
    } catch (error) {
      console.warn("Join by code failed:", error);
      showToast(
        "Impossible de rejoindre ce club. Vérifie le code.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestJoin = async () => {
    if (!clubSlug.trim()) {
      showToast("Saisis le nom du club.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const client = createApiClient();
      await requestClubJoinBySlug(client, clubSlug.trim(), {
        message: requestMessage.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Demande envoyée.", "success");
      setClubSlug("");
      setRequestMessage("");
      await loadMemberships();
    } catch (error: unknown) {
      console.warn("Request join failed:", error);
      const msg =
        error instanceof Error ? error.message : "Impossible d'envoyer la demande.";
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateInvite = async () => {
    const approvedClubId = primaryMembership?.clubId;
    if (!approvedClubId) {
      showToast("Club introuvable.", "error");
      return;
    }
    setIsGeneratingInvite(true);
    try {
      const client = createApiClient();
      const result = await createClubInvite(client, approvedClubId);
      if (!result.code) {
        showToast("Impossible de générer le code. Réessaie.", "error");
        return;
      }
      setGeneratedInviteCode(result.code);
      showToast("Code généré", "success");
    } catch (error) {
      console.warn("Generate invite failed:", error);
      showToast("Impossible de générer le code. Réessaie.", "error");
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!generatedInviteCode) return;
    await Clipboard.setStringAsync(generatedInviteCode);
    showToast("Code copié", "success");
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

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backRow}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backLabel}>Club</Text>
        </Pressable>
        <Text style={styles.title}>Invitations</Text>
        <Text style={styles.subtitle}>
          Codes, demandes et administration — sans inscription automatique aux sorties.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isCoachOrAdmin && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>RESPONSABLE</Text>
            {adminMemberships.length > 1 ? (
              <View style={styles.clubPickRow} testID="invite-club-picker">
                {adminMemberships.map((m) => {
                  const active = m.clubId === primaryMembership?.clubId;
                  return (
                    <Pressable
                      key={m.clubId}
                      testID={`invite-club-${m.clubId}`}
                      onPress={() => {
                        setInviteClubId(m.clubId);
                        setGeneratedInviteCode(null);
                      }}
                      style={[
                        styles.clubPickChip,
                        active && styles.clubPickChipOn,
                      ]}
                    >
                      <Text
                        style={[
                          styles.clubPickText,
                          active && styles.clubPickTextOn,
                        ]}
                        numberOfLines={1}
                      >
                        {m.club?.name ?? "Club"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}
              onPress={() => router.push("/(tabs)/club/admin" as Href)}
            >
              <Text style={styles.secondaryButtonText}>
                Demandes en attente
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                (pressed || isGeneratingInvite) &&
                  styles.secondaryButtonPressed,
              ]}
              onPress={handleGenerateInvite}
              disabled={isGeneratingInvite}
              accessibilityRole="button"
              accessibilityLabel="Inviter quelqu’un"
              testID="club-generate-invite"
            >
              <Text style={styles.secondaryButtonText}>
                Inviter quelqu’un
                {primaryMembership?.club?.name
                  ? ` · ${primaryMembership.club.name}`
                  : ""}
              </Text>
            </Pressable>
            {generatedInviteCode && (
              <View style={styles.inviteRow}>
                <Text
                  style={styles.inviteCode}
                  testID="club-invite-code"
                  accessibilityLabel={`Code ${generatedInviteCode}`}
                >
                  {generatedInviteCode}
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.copyButton,
                    pressed && styles.copyButtonPressed,
                  ]}
                  onPress={handleCopyInvite}
                  accessibilityRole="button"
                  accessibilityLabel="Copier le code"
                  testID="club-copy-invite"
                >
                  <Text style={styles.copyButtonText}>Copier</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>REJOINDRE AVEC CODE</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Code d&apos;invitation</Text>
            <TextInput
              style={styles.textInput}
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="Ex: CRC2026"
              placeholderTextColor={t.outline}
              autoCapitalize="characters"
              editable={!isSubmitting}
              accessibilityLabel="Code d'invitation"
              testID="club-invite-code-input"
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || isSubmitting) && styles.primaryButtonPressed,
            ]}
            onPress={handleJoinByCode}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Rejoindre avec code"
            testID="club-join-by-code"
          >
            <Text style={styles.primaryButtonText}>Rejoindre</Text>
          </Pressable>
          <Text style={styles.helperText}>
            Rejoindre un club ne t’inscrit à aucune sortie.
          </Text>
          {isApprovedMember && (
            <Text style={styles.helperText}>
              Tu peux rejoindre plusieurs clubs. Ce code ajoutera un club
              supplémentaire.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>DEMANDER À REJOINDRE</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nom du club</Text>
            <TextInput
              style={styles.textInput}
              value={clubSlug}
              onChangeText={setClubSlug}
              placeholder="Ex: Casablanca Running Club"
              placeholderTextColor={t.outline}
              autoCapitalize="none"
              editable={!isSubmitting}
              accessibilityLabel="Nom du club"
              testID="club-request-name-input"
            />
            <Text style={styles.helperText}>
              Si tu n&apos;as pas de code, entre le nom du club.
            </Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Message (optionnel)</Text>
            <TextInput
              style={styles.textInput}
              value={requestMessage}
              onChangeText={setRequestMessage}
              placeholder="Pourquoi tu veux rejoindre ?"
              placeholderTextColor={t.outline}
              autoCapitalize="sentences"
              editable={!isSubmitting}
              testID="club-request-message-input"
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              (pressed || isSubmitting) && styles.secondaryButtonPressed,
            ]}
            onPress={handleRequestJoin}
            disabled={isSubmitting || isPendingMember}
            accessibilityRole="button"
            accessibilityLabel="Envoyer la demande"
            testID="club-request-submit"
          >
            <Text style={styles.secondaryButtonText}>
              {isPendingMember ? "Demande en attente" : "Envoyer la demande"}
            </Text>
          </Pressable>
          {isPendingMember && (
            <Text style={styles.helperText}>
              Un responsable du club doit valider ta demande.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>CRÉER UN CLUB</Text>
          <Pressable
            style={({ pressed }) => [
              styles.createButton,
              pressed && styles.createButtonPressed,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/club/create" as Href);
            }}
            accessibilityRole="button"
            accessibilityLabel="Créer un club"
            testID="club-create-nav"
          >
            <Text style={styles.createButtonText}>Créer un club</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <Text style={styles.helperText}>Chargement…</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: t.canvas,
  },
  clubPickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  clubPickChip: {
    borderRadius: t.radiusChip,
    borderWidth: 1,
    borderColor: t.outlineVariant,
    backgroundColor: t.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clubPickChipOn: {
    backgroundColor: t.primary,
    borderColor: t.primary,
  },
  clubPickText: {
    color: t.text,
    fontSize: 13,
    fontFamily: t.font.space.semibold,
  },
  clubPickTextOn: {
    color: t.onPrimary,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backIcon: {
    color: t.text,
    fontSize: 28,
    fontWeight: "300",
    marginRight: 4,
  },
  backLabel: {
    color: t.textSecondary,
    fontSize: 15,
    fontFamily: t.font.space.semibold,
  },
  title: {
    ...t.type.pageTitle,
    fontSize: 24,
    lineHeight: 28,
    color: t.text,
  },
  subtitle: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    color: t.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    gap: 4,
  },
  cardLabel: {
    ...t.type.labelSm,
    color: t.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  fieldRow: {
    marginBottom: 10,
  },
  fieldLabel: {
    color: t.textSecondary,
    fontSize: 13,
    marginBottom: 6,
    fontFamily: t.font.hanken.regular,
  },
  textInput: {
    backgroundColor: t.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: t.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: t.outlineVariant,
    fontFamily: t.font.hanken.regular,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: t.primary,
    paddingVertical: 12,
    borderRadius: t.radiusChip,
    alignItems: "center",
  },
  primaryButtonPressed: {
    opacity: 0.8,
  },
  primaryButtonText: {
    color: t.onPrimary,
    fontSize: 15,
    fontFamily: t.font.space.bold,
  },
  secondaryButton: {
    marginTop: 8,
    borderColor: t.outlineVariant,
    borderWidth: 1,
    backgroundColor: t.surfaceContainerLow,
    paddingVertical: 12,
    borderRadius: t.radiusChip,
    alignItems: "center",
  },
  secondaryButtonPressed: {
    opacity: 0.8,
  },
  secondaryButtonText: {
    color: t.text,
    fontSize: 15,
    fontFamily: t.font.space.semibold,
  },
  createButton: {
    marginTop: 8,
    borderColor: t.primary,
    borderWidth: 1,
    backgroundColor: "rgba(0,95,52,0.08)",
    paddingVertical: 12,
    borderRadius: t.radiusChip,
    alignItems: "center",
  },
  createButtonPressed: {
    opacity: 0.8,
  },
  createButtonText: {
    color: t.primary,
    fontSize: 14,
    fontFamily: t.font.space.bold,
  },
  inviteRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: t.surfaceContainerLow,
  },
  inviteCode: {
    color: t.text,
    fontSize: 16,
    fontFamily: t.font.space.bold,
    letterSpacing: 1,
  },
  copyButton: {
    borderWidth: 1,
    borderColor: t.outlineVariant,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: t.radiusChip,
    backgroundColor: t.card,
  },
  copyButtonPressed: {
    opacity: 0.8,
  },
  copyButtonText: {
    color: t.text,
    fontSize: 12,
    fontFamily: t.font.space.semibold,
  },
  helperText: {
    color: t.outline,
    fontSize: 12,
    marginTop: 8,
    fontFamily: t.font.hanken.regular,
    lineHeight: 17,
  },
});