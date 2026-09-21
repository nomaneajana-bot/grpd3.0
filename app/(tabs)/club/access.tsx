import { type Href, router, Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import {
  borderRadius,
  colors,
  hairline,
  spacing,
} from "@/constants/ui";
import { useToast } from "@/hooks/useToast";
import {
  getClubInitials,
  JOIN_MODE_LABELS,
} from "@/lib/clubMetadata";
import {
  createApiClient,
  createClubInvite,
  getMyMemberships,
  joinClubByCode,
  requestClubJoin,
  requestClubJoinBySlug,
  resolveClub,
} from "@/lib/api";
import type { ClubJoinMode, ClubMembership, ClubResolveResult } from "@/types/api";

function OrDivider() {
  return (
    <View style={styles.orRow}>
      <View style={styles.orLine} />
      <Text style={styles.orText}>ou</Text>
      <View style={styles.orLine} />
    </View>
  );
}

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
  const [resolvedClub, setResolvedClub] = useState<ClubResolveResult | null>(
    null,
  );
  const [resolveMode, setResolveMode] = useState<"code" | "slug" | null>(null);
  const [codeError, setCodeError] = useState("");
  const { toast, showToast, hideToast } = useToast();

  const formatDues = (cents: number | null | undefined) => {
    if (cents == null) return null;
    return `${(cents / 100).toFixed(0)} MAD`;
  };

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
    void loadMemberships();
  }, [loadMemberships]);

  const primaryMembership =
    memberships.find((m) => m.status === "approved") ??
    memberships.find((m) => m.status === "pending") ??
    null;
  const isApprovedMember = primaryMembership?.status === "approved";
  const isPendingMember = primaryMembership?.status === "pending";
  const isInClub = isApprovedMember || isPendingMember;
  const isCoachOrAdmin =
    isApprovedMember &&
    (primaryMembership?.role === "admin" || primaryMembership?.role === "coach");

  const handleResolveCode = async () => {
    if (!inviteCode.trim()) {
      showToast("Ajoute un code d'invitation.", "error");
      return;
    }
    setCodeError("");
    setIsSubmitting(true);
    setResolvedClub(null);
    setResolveMode(null);
    try {
      const client = createApiClient();
      const result = await resolveClub(client, {
        inviteCode: inviteCode.trim(),
      });
      setResolvedClub(result);
      setResolveMode("code");
    } catch {
      setCodeError("Code invalide ou expiré. Vérifie avec ton admin.");
      showToast("Code invalide ou club introuvable.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveSlug = async () => {
    if (!clubSlug.trim()) {
      showToast("Saisis le nom du club.", "error");
      return;
    }
    setIsSubmitting(true);
    setResolvedClub(null);
    setResolveMode(null);
    try {
      const client = createApiClient();
      const slug = clubSlug
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const result = await resolveClub(client, { slug });
      setResolvedClub(result);
      setResolveMode("slug");
    } catch {
      showToast("Club introuvable.", "error");
      setResolvedClub(null);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      setResolvedClub(null);
      setResolveMode(null);
      setCodeError("");
      await loadMemberships();
    } catch (error) {
      console.warn("Join by code failed:", error);
      showToast(
        "Impossible de rejoindre ce club. Vérifie le code ou l'API.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestJoin = async () => {
    const targetClubId = resolvedClub?.clubId;
    const slug = clubSlug.trim();
    if (!targetClubId && !slug) {
      showToast("Vérifie le club avant d'envoyer la demande.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const client = createApiClient();
      if (targetClubId) {
        await requestClubJoin(client, targetClubId, {
          message: requestMessage.trim() || undefined,
        });
      } else {
        await requestClubJoinBySlug(client, slug, {
          message: requestMessage.trim() || undefined,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Demande envoyée.", "success");
      setClubSlug("");
      setRequestMessage("");
      setResolvedClub(null);
      setResolveMode(null);
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

  const resolvedJoinMode: ClubJoinMode | undefined =
    resolvedClub?.club.joinMode;
  const accessLabel = resolvedJoinMode
    ? JOIN_MODE_LABELS[resolvedJoinMode]
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={hideToast}
        />
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.navBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.navBackText}>‹ Club</Text>
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Rejoindre un club</Text>
            <Text style={styles.subtitle}>
              Via code d&apos;invitation ou demande directe.
            </Text>
          </View>

          {isCoachOrAdmin ? (
            <View style={styles.pathCard}>
              <Text style={styles.pathTitle}>Responsable</Text>
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => router.push("/(tabs)/club/admin" as Href)}
              >
                <Text style={styles.secondaryBtnText}>Demandes en attente</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryBtn}
                onPress={handleGenerateInvite}
                disabled={isGeneratingInvite}
              >
                <Text style={styles.secondaryBtnText}>
                  {isGeneratingInvite
                    ? "Génération…"
                    : "Générer un code d'invitation"}
                </Text>
              </Pressable>
              {generatedInviteCode ? (
                <View style={styles.inviteRow}>
                  <Text style={styles.inviteCode}>{generatedInviteCode}</Text>
                  <Pressable onPress={handleCopyInvite} style={styles.copyBtn}>
                    <Text style={styles.copyBtnText}>Copier</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.pathCard}>
            <Text style={styles.pathTitle}>Code d&apos;invitation</Text>
            <View style={styles.codeRow}>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={inviteCode}
                onChangeText={(v) => {
                  setInviteCode(v.toUpperCase());
                  setCodeError("");
                  setResolvedClub(null);
                  setResolveMode(null);
                }}
                placeholder="CRC-2026"
                placeholderTextColor={colors.text.tertiary}
                autoCapitalize="characters"
                editable={!isApprovedMember}
                returnKeyType="done"
                onSubmitEditing={() => void handleResolveCode()}
              />
              <Pressable
                style={[
                  styles.btnVerify,
                  (!inviteCode.trim() || isSubmitting || isApprovedMember) &&
                    styles.btnDisabled,
                ]}
                onPress={() => void handleResolveCode()}
                disabled={!inviteCode.trim() || isSubmitting || isApprovedMember}
              >
                {isSubmitting && resolveMode !== "slug" ? (
                  <ActivityIndicator size="small" color={colors.text.onAccent} />
                ) : (
                  <Text style={styles.btnVerifyText}>Vérifier</Text>
                )}
              </Pressable>
            </View>
            {codeError ? (
              <View style={styles.errorPill}>
                <Text style={styles.errorText}>{codeError}</Text>
              </View>
            ) : null}
            {resolvedClub && resolveMode === "code" ? (
              <View style={styles.codeResultCard}>
                <View style={styles.codeResultRow}>
                  <View style={styles.codeResultAvatar}>
                    <Text style={styles.codeResultAvatarText}>
                      {getClubInitials(resolvedClub.club.name)}
                    </Text>
                  </View>
                  <View style={styles.codeResultInfo}>
                    <Text style={styles.codeResultName}>
                      {resolvedClub.club.name}
                    </Text>
                    <Text style={styles.codeResultMeta}>
                      {resolvedClub.club.city ?? "—"}
                      {accessLabel ? ` · ${accessLabel}` : ""}
                    </Text>
                    {resolvedClub.club.isPaid ? (
                      <Text style={styles.duesHint}>
                        {resolvedClub.club.duesLabel ?? "Club payant"} —{" "}
                        {formatDues(resolvedClub.club.duesAmountCents) ??
                          "cotisation"}{" "}
                        en espèces auprès de l&apos;admin.
                      </Text>
                    ) : null}
                  </View>
                </View>
                {!isApprovedMember ? (
                  <Pressable
                    style={[
                      styles.btnJoin,
                      isSubmitting && styles.btnDisabled,
                    ]}
                    onPress={() => void handleJoinByCode()}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.btnJoinText}>Rejoindre ce club</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.helperText}>
                    Tu es déjà membre d&apos;un club.
                  </Text>
                )}
              </View>
            ) : null}
          </View>

          <OrDivider />

          <View style={styles.pathCard}>
            <Text style={styles.pathTitle}>Rechercher un club</Text>
            <View style={styles.searchRow}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                style={[styles.input, styles.searchInput]}
                value={clubSlug}
                onChangeText={(v) => {
                  setClubSlug(v);
                  setResolvedClub(null);
                  setResolveMode(null);
                }}
                placeholder="Nom du club…"
                placeholderTextColor={colors.text.tertiary}
                autoCapitalize="words"
                editable={!isInClub}
                returnKeyType="search"
                onSubmitEditing={() => void handleResolveSlug()}
              />
              {isSubmitting && resolveMode !== "code" ? (
                <ActivityIndicator
                  size="small"
                  color={colors.text.secondary}
                  style={styles.searchSpinner}
                />
              ) : null}
            </View>

            {resolvedClub && resolveMode === "slug" ? (
              <View style={styles.clubResult}>
                <View
                  style={[
                    styles.clubResultAvatar,
                    { backgroundColor: colors.accent.primaryMid },
                  ]}
                >
                  <Text
                    style={[
                      styles.clubResultAvatarText,
                      { color: colors.text.accent },
                    ]}
                  >
                    {getClubInitials(resolvedClub.club.name)}
                  </Text>
                </View>
                <View style={styles.clubResultInfo}>
                  <Text style={styles.clubResultName} numberOfLines={1}>
                    {resolvedClub.club.name}
                  </Text>
                  <Text style={styles.clubResultMeta}>
                    {resolvedClub.club.city ?? "—"}
                    {accessLabel ? ` · ${accessLabel}` : ""}
                  </Text>
                </View>
              </View>
            ) : null}

            {resolvedClub && resolveMode === "slug" && !isInClub ? (
              <View style={styles.requestForm}>
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>
                  Message{"  "}
                  <Text style={styles.optional}>(optionnel)</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.messageInput]}
                  value={requestMessage}
                  onChangeText={setRequestMessage}
                  placeholder="Pourquoi tu veux rejoindre ?"
                  placeholderTextColor={colors.text.tertiary}
                  multiline
                  textAlignVertical="top"
                />
                {resolvedClub.club.isPaid ? (
                  <Text style={styles.duesHint}>
                    {resolvedClub.club.duesLabel ?? "Club payant"} — règlement
                    en espèces après validation.
                  </Text>
                ) : null}
                <Pressable
                  style={[styles.btnPrimary, isSubmitting && styles.btnDisabled]}
                  onPress={() => void handleRequestJoin()}
                  disabled={isSubmitting}
                >
                  <Text style={styles.btnPrimaryText}>
                    {isPendingMember
                      ? "Demande en attente"
                      : "Envoyer la demande"}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {isInClub ? (
              <Text style={styles.helperText}>
                {isPendingMember
                  ? "Un responsable doit valider ta demande."
                  : "Tu es déjà membre d'un club."}
              </Text>
            ) : null}
          </View>

          <View style={styles.sectionDivider} />

          {!isApprovedMember ? (
            <Pressable
              style={styles.createRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/club/create" as Href);
              }}
            >
              <View style={styles.createInfo}>
                <Text style={styles.createTitle}>Créer mon propre club</Text>
                <Text style={styles.createSub}>
                  Gérer mes groupes et mes séances
                </Text>
              </View>
              <View style={styles.createBtn}>
                <Text style={styles.createBtnText}>Créer →</Text>
              </View>
            </Pressable>
          ) : null}

          {isLoading ? (
            <Text style={styles.helperText}>Chargement…</Text>
          ) : null}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  flex: { flex: 1 },
  navBack: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navBackText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.accent.primary,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 22,
    paddingTop: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text.primary,
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  pathCard: {
    backgroundColor: colors.surface.s2,
    borderRadius: borderRadius.xl,
    borderWidth: hairline,
    borderColor: colors.border.default,
    padding: 18,
    marginBottom: 12,
  },
  pathTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 14,
  },
  input: {
    backgroundColor: colors.surface.s3,
    borderWidth: hairline,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.text.primary,
  },
  codeRow: {
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
  },
  codeInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  btnVerify: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  btnVerifyText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text.onAccent,
  },
  btnDisabled: { opacity: 0.38 },
  errorPill: {
    marginTop: 10,
    backgroundColor: colors.surface.error,
    borderRadius: borderRadius.md,
    borderWidth: hairline,
    borderColor: colors.accent.error,
    padding: 10,
  },
  errorText: {
    fontSize: 12,
    color: colors.text.errorMuted,
    lineHeight: 18,
  },
  codeResultCard: {
    marginTop: 12,
    backgroundColor: colors.tag.greenBg,
    borderRadius: borderRadius.md,
    borderWidth: hairline,
    borderColor: colors.accent.success,
    padding: 12,
  },
  codeResultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  codeResultAvatar: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accent.primaryMid,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  codeResultAvatarText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.text.accent,
  },
  codeResultInfo: { flex: 1 },
  codeResultName: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 2,
  },
  codeResultMeta: {
    fontSize: 11,
    color: colors.accent.success,
  },
  duesHint: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 4,
    lineHeight: 16,
  },
  btnJoin: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    padding: 12,
    alignItems: "center",
  },
  btnJoinText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text.onAccent,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 16,
  },
  orLine: {
    flex: 1,
    height: hairline,
    backgroundColor: colors.border.default,
  },
  orText: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: "600",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
    color: colors.text.secondary,
    width: 22,
    textAlign: "center",
  },
  searchInput: { flex: 1 },
  searchSpinner: { marginRight: 4 },
  clubResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    padding: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.s3,
    borderWidth: hairline,
    borderColor: colors.border.default,
  },
  clubResultAvatar: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  clubResultAvatarText: {
    fontSize: 11,
    fontWeight: "800",
  },
  clubResultInfo: { flex: 1 },
  clubResultName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text.primary,
  },
  clubResultMeta: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  requestForm: { marginTop: 4 },
  divider: {
    height: hairline,
    backgroundColor: colors.border.default,
    marginVertical: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  optional: {
    fontWeight: "400",
    textTransform: "none",
    color: colors.text.tertiary,
  },
  messageInput: {
    height: 70,
    paddingTop: 13,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  btnPrimary: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text.onAccent,
  },
  secondaryBtn: {
    marginTop: spacing.sm,
    borderWidth: hairline,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.pill,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  inviteRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.s3,
  },
  inviteCode: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  copyBtn: {
    borderWidth: hairline,
    borderColor: colors.border.medium,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
  },
  copyBtnText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  helperText: {
    color: colors.text.tertiary,
    fontSize: 12,
    marginTop: 10,
    lineHeight: 18,
  },
  sectionDivider: {
    height: hairline,
    backgroundColor: colors.border.default,
    marginVertical: 20,
  },
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  createInfo: { flex: 1 },
  createTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 3,
  },
  createSub: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  createBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: borderRadius.pill,
    borderWidth: hairline,
    borderColor: colors.border.medium,
    backgroundColor: colors.surface.s2,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text.primary,
  },
});
