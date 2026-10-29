import { type Href, router, Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { ClubKeyPresence } from "@/components/club/ClubKeyPresence";
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
import {
  extractInviteCode,
  inviteShareMessage,
  inviteShareUrl,
} from "@/lib/clubInviteKey";
import type { ClubMembership } from "@/types/api";

type Presence = {
  name: string;
  city?: string | null;
  mode: "joined" | "pending";
};

/**
 * Club join / key flow.
 * Primary for joiners: search by club name (knock — not a public directory browse).
 * Secondary: paste a received invite code/link.
 * Admin: mint + share a key.
 */
export default function ClubAccessScreen() {
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyPaste, setKeyPaste] = useState("");
  const [generatedInviteCode, setGeneratedInviteCode] = useState<string | null>(
    null,
  );
  const [showKeyEntry, setShowKeyEntry] = useState(false);
  const [clubSlug, setClubSlug] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [inviteClubId, setInviteClubId] = useState<string | null>(null);
  const [presence, setPresence] = useState<Presence | null>(null);
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
    void loadMemberships();
  }, [loadMemberships]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const prevBody = document.body.style.backgroundColor;
    const prevHtml = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = t.canvas;
    document.documentElement.style.backgroundColor = t.canvas;
    return () => {
      document.body.style.backgroundColor = prevBody;
      document.documentElement.style.backgroundColor = prevHtml;
    };
  }, []);

  const approvedMemberships = memberships.filter((m) => m.status === "approved");
  const adminMemberships = approvedMemberships.filter(
    (m) => m.role === "admin" || m.role === "coach",
  );
  const adminMembership =
    adminMemberships.find((m) => m.clubId === inviteClubId) ??
    adminMemberships[0] ??
    null;
  const isCoachOrAdmin = Boolean(adminMembership);
  const isPendingMember = memberships.some((m) => m.status === "pending");

  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (!text?.trim()) {
        showToast("Presse-papiers vide.", "error");
        return;
      }
      setKeyPaste(text.trim());
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      showToast("Impossible de lire le presse-papiers.", "error");
    }
  };

  const handleOpenDoor = async () => {
    const code = extractInviteCode(keyPaste);
    if (!code) {
      showToast("Colle un code ou un lien d’invitation.", "error");
      return;
    }
    setIsSubmitting(true);
    setPresence(null);
    try {
      const client = createApiClient();
      const result = await joinClubByCode(client, { code });
      const club = result.membership?.club;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPresence({
        name: club?.name?.trim() || "Ton club",
        city: club?.city ?? null,
        mode: "joined",
      });
      setKeyPaste("");
      showToast("Bienvenue — porte ouverte.", "success");
      await loadMemberships();
    } catch (error) {
      console.warn("Join by code failed:", error);
      showToast("Cette clé ne marche pas. Vérifie le code ou le lien.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestJoin = async () => {
    if (!clubSlug.trim()) {
      showToast("Indique le nom du club.", "error");
      return;
    }
    setIsSubmitting(true);
    setPresence(null);
    try {
      const client = createApiClient();
      const result = await requestClubJoinBySlug(client, clubSlug.trim(), {
        message: requestMessage.trim() || undefined,
      });
      const club = result.membership?.club;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPresence({
        name: club?.name?.trim() || clubSlug.trim(),
        city: club?.city ?? null,
        mode: "pending",
      });
      setClubSlug("");
      setRequestMessage("");
      showToast("Demande envoyée.", "success");
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
    const clubId = adminMembership?.clubId;
    if (!clubId) {
      showToast("Club introuvable.", "error");
      return;
    }
    setIsGeneratingInvite(true);
    try {
      const client = createApiClient();
      const result = await createClubInvite(client, clubId);
      if (!result.code) {
        showToast("Impossible de générer la clé. Réessaie.", "error");
        return;
      }
      setGeneratedInviteCode(result.code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn("Generate invite failed:", error);
      showToast("Impossible de générer la clé. Réessaie.", "error");
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleShareKey = async () => {
    if (!generatedInviteCode) {
      await handleGenerateInvite();
      return;
    }
    const message = inviteShareMessage(
      generatedInviteCode,
      adminMembership?.club?.name,
    );
    try {
      await Share.share({
        message,
        title: adminMembership?.club?.name
          ? `Invitation · ${adminMembership.club.name}`
          : "Invitation GRpD",
        url:
          Platform.OS === "ios"
            ? undefined
            : inviteShareUrl(generatedInviteCode),
      });
    } catch {
      await Clipboard.setStringAsync(message);
      showToast("Message d’invitation copié.", "success");
    }
  };

  const handleCopyKey = async () => {
    if (!generatedInviteCode) return;
    await Clipboard.setStringAsync(generatedInviteCode);
    showToast("Clé copiée", "success");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
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
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backLabel}>Clubs</Text>
        </Pressable>
        <Text style={styles.brand} testID="club-key-brand">
          GRpD
        </Text>
        <Text style={styles.title} testID="club-key-title">
          Rejoindre un club
        </Text>
        <Text style={styles.subtitle}>
          Cherche le nom si tu le connais — ou ouvre la porte avec une clé
          qu’on t’a envoyée. Ce n’est pas un annuaire public.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        testID="club-key-scroll"
      >
        {presence ? (
          <View style={styles.presenceBlock}>
            <ClubKeyPresence
              name={presence.name}
              city={presence.city}
              mode={presence.mode}
            />
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
              onPress={() => router.replace("/(tabs)/club" as Href)}
              testID="club-key-go-club"
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>Voir le club</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Top pill — Rejoindre by name */}
            <View style={styles.pillPrimary} testID="club-key-name-form">
              <Text style={styles.pillKicker}>Rejoindre</Text>
              <Text style={styles.pillTitle}>Tu connais le nom ?</Text>
              <Text style={styles.pillHint}>
                Tape le nom du club. Un responsable décide — ce n’est pas un
                catalogue public.
              </Text>
              <TextInput
                style={styles.keyInput}
                value={clubSlug}
                onChangeText={setClubSlug}
                placeholder="Rechercher un club…"
                placeholderTextColor={t.outline}
                autoCapitalize="words"
                editable={!isSubmitting}
                accessibilityLabel="Rechercher un club par nom"
                testID="club-request-name-input"
              />
              <TextInput
                style={[styles.keyInput, styles.messageInput]}
                value={requestMessage}
                onChangeText={setRequestMessage}
                placeholder="Un mot pour te présenter (optionnel)"
                placeholderTextColor={t.outline}
                autoCapitalize="sentences"
                editable={!isSubmitting}
                testID="club-request-message-input"
              />
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  (pressed || isSubmitting || isPendingMember) && styles.pressed,
                ]}
                onPress={() => void handleRequestJoin()}
                disabled={isSubmitting || isPendingMember}
                accessibilityRole="button"
                accessibilityLabel="Demander à rejoindre"
                testID="club-request-submit"
              >
                <Text style={styles.primaryButtonText}>
                  {isPendingMember
                    ? "Demande déjà en attente"
                    : "Demander à rejoindre"}
                </Text>
              </Pressable>
              <Text style={styles.footnoteInPill}>
                Une demande n’est ni une adhésion confirmée ni une inscription
                à une sortie.
              </Text>
            </View>

            {/* Bottom pill — clé, or Partager when coach/admin */}
            {isCoachOrAdmin ? (
              <View style={styles.pillSecondary} testID="club-key-invite-block">
                <Text style={styles.pillKicker}>Partager</Text>
                <Text style={styles.pillTitle}>
                  Inviter dans{" "}
                  {adminMembership?.club?.name?.trim() || "ton club"}
                </Text>
                <Text style={styles.pillHint}>
                  Envoie la clé sur WhatsApp, Instagram ou en message — pas dans
                  un catalogue.
                </Text>

                {adminMemberships.length > 1 ? (
                  <View style={styles.clubPickRow} testID="invite-club-picker">
                    {adminMemberships.map((m) => {
                      const active = m.clubId === adminMembership?.clubId;
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
                    styles.primaryButton,
                    (pressed || isGeneratingInvite) && styles.pressed,
                  ]}
                  onPress={() => void handleShareKey()}
                  disabled={isGeneratingInvite}
                  accessibilityRole="button"
                  accessibilityLabel="Partager une clé"
                  testID="club-generate-invite"
                >
                  <Text style={styles.primaryButtonText}>
                    {generatedInviteCode
                      ? "Partager la clé"
                      : "Créer et partager une clé"}
                  </Text>
                </Pressable>

                {generatedInviteCode ? (
                  <View style={styles.keyReveal} testID="club-invite-code-row">
                    <View>
                      <Text style={styles.keyLabel}>CLÉ</Text>
                      <Text
                        style={styles.keyCode}
                        testID="club-invite-code"
                        accessibilityLabel={`Code ${generatedInviteCode}`}
                      >
                        {generatedInviteCode}
                      </Text>
                      <Text style={styles.keyLink} numberOfLines={1}>
                        {inviteShareUrl(generatedInviteCode)}
                      </Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        styles.copyButton,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => void handleCopyKey()}
                      accessibilityRole="button"
                      accessibilityLabel="Copier la clé"
                      testID="club-copy-invite"
                    >
                      <Text style={styles.copyButtonText}>Copier</Text>
                    </Pressable>
                  </View>
                ) : null}

                <Pressable
                  style={styles.textLinkWrap}
                  onPress={() => router.push("/(tabs)/club/admin" as Href)}
                  accessibilityRole="button"
                >
                  <Text style={styles.textLink}>Demandes en attente →</Text>
                </Pressable>

                <Pressable
                  onPress={() => setShowKeyEntry((v) => !v)}
                  style={styles.keyToggleInPill}
                  testID="club-key-code-toggle"
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showKeyEntry }}
                >
                  <Text style={styles.keyToggleText}>
                    {showKeyEntry
                      ? "J’ai une clé"
                      : "J’ai une clé (code ou lien) →"}
                  </Text>
                </Pressable>
                {showKeyEntry ? (
                  <View style={styles.knockForm} testID="club-key-join-block">
                    <Text style={styles.knockHint}>
                      Colle le code ou le lien qu’on t’a envoyé.
                    </Text>
                    <TextInput
                      style={styles.keyInput}
                      value={keyPaste}
                      onChangeText={setKeyPaste}
                      placeholder="Code ou lien (grpd.run/c/…)"
                      placeholderTextColor={t.outline}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting}
                      accessibilityLabel="Code ou lien d'invitation"
                      testID="club-invite-code-input"
                    />
                    <View style={styles.rowActions}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.ghostButton,
                          pressed && styles.pressed,
                        ]}
                        onPress={() => void handlePasteFromClipboard()}
                        testID="club-key-paste"
                        accessibilityRole="button"
                        accessibilityLabel="Coller depuis le presse-papiers"
                      >
                        <Text style={styles.ghostButtonText}>Coller</Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [
                          styles.primaryButton,
                          styles.primaryFlex,
                          (pressed || isSubmitting) && styles.pressed,
                        ]}
                        onPress={() => void handleOpenDoor()}
                        disabled={isSubmitting}
                        accessibilityRole="button"
                        accessibilityLabel="Ouvrir la porte"
                        testID="club-join-by-code"
                      >
                        <Text style={styles.primaryButtonText}>
                          Ouvrir la porte
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.pillSecondary} testID="club-key-join-pill">
                <Pressable
                  onPress={() => setShowKeyEntry((v) => !v)}
                  testID="club-key-code-toggle"
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showKeyEntry }}
                >
                  <Text style={styles.pillKicker}>Clé</Text>
                  <Text style={styles.pillTitle}>
                    {showKeyEntry
                      ? "J’ai une clé"
                      : "J’ai une clé (code ou lien)"}
                  </Text>
                  {!showKeyEntry ? (
                    <Text style={styles.pillHint}>
                      Colle le code ou le lien qu’on t’a envoyé →
                    </Text>
                  ) : null}
                </Pressable>
                {showKeyEntry ? (
                  <View style={styles.knockForm} testID="club-key-join-block">
                    <Text style={styles.knockHint}>
                      Colle le code ou le lien qu’on t’a envoyé.
                    </Text>
                    <TextInput
                      style={styles.keyInput}
                      value={keyPaste}
                      onChangeText={setKeyPaste}
                      placeholder="Code ou lien (grpd.run/c/…)"
                      placeholderTextColor={t.outline}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting}
                      accessibilityLabel="Code ou lien d'invitation"
                      testID="club-invite-code-input"
                    />
                    <View style={styles.rowActions}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.ghostButton,
                          pressed && styles.pressed,
                        ]}
                        onPress={() => void handlePasteFromClipboard()}
                        testID="club-key-paste"
                        accessibilityRole="button"
                        accessibilityLabel="Coller depuis le presse-papiers"
                      >
                        <Text style={styles.ghostButtonText}>Coller</Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [
                          styles.primaryButton,
                          styles.primaryFlex,
                          (pressed || isSubmitting) && styles.pressed,
                        ]}
                        onPress={() => void handleOpenDoor()}
                        disabled={isSubmitting}
                        accessibilityRole="button"
                        accessibilityLabel="Ouvrir la porte"
                        testID="club-join-by-code"
                      >
                        <Text style={styles.primaryButtonText}>
                          Ouvrir la porte
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            )}

            {/* Compat: old tests may toggle name form — keep a hidden alias */}
            <View style={{ height: 0, overflow: "hidden" }}>
              <Pressable testID="club-key-name-toggle" />
            </View>

            <Pressable
              style={styles.createWrap}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/club/create" as Href);
              }}
              accessibilityRole="button"
              accessibilityLabel="Créer un club"
              testID="club-create-nav"
            >
              <Text style={styles.createText}>Créer mon club →</Text>
            </Pressable>
          </>
        )}

        {isLoading ? (
          <Text style={styles.footnote}>Chargement…</Text>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
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
  brand: {
    color: t.primary,
    fontFamily: t.font.space.bold,
    fontSize: 13,
    letterSpacing: 3.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  title: {
    color: t.text,
    fontFamily: t.font.space.bold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: t.textSecondary,
    fontFamily: t.font.hanken.regular,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 340,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 14,
  },
  pillPrimary: {
    backgroundColor: t.card,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(0,95,52,0.12)",
    shadowColor: "#1A1C1D",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pillSecondary: {
    backgroundColor: t.surfaceContainerLow,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(190,202,190,0.45)",
  },
  pillKicker: {
    color: t.primary,
    fontFamily: t.font.hanken.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  pillTitle: {
    color: t.text,
    fontFamily: t.font.space.bold,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.25,
    marginBottom: 4,
  },
  pillHint: {
    color: t.textSecondary,
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  keyInput: {
    backgroundColor: t.canvas,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(190,202,190,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: t.text,
    fontSize: 16,
    fontFamily: t.font.hanken.regular,
    marginBottom: 10,
  },
  messageInput: {
    minHeight: 64,
    textAlignVertical: "top",
  },
  footnoteInPill: {
    color: t.outline,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: t.font.hanken.regular,
    marginTop: 10,
  },
  keyToggleInPill: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(190,202,190,0.55)",
  },
  keyToggleText: {
    color: t.textSecondary,
    fontSize: 14,
    fontFamily: t.font.space.semibold,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  primaryButton: {
    backgroundColor: t.primary,
    borderRadius: t.radiusChip,
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryFlex: {
    flex: 1,
  },
  primaryButtonText: {
    color: t.onPrimary,
    fontSize: 15,
    fontFamily: t.font.space.bold,
  },
  ghostButton: {
    borderRadius: t.radiusChip,
    minHeight: 52,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: t.surfaceContainerHigh,
    backgroundColor: t.surfaceContainer,
  },
  ghostButtonText: {
    color: t.text,
    fontSize: 15,
    fontFamily: t.font.space.semibold,
  },
  secondaryButton: {
    borderRadius: t.radiusChip,
    minHeight: 48,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: t.surfaceContainerHigh,
    backgroundColor: t.surfaceContainer,
  },
  secondaryButtonText: {
    color: t.text,
    fontSize: 15,
    fontFamily: t.font.space.semibold,
  },
  pressed: {
    opacity: 0.82,
  },
  footnote: {
    color: t.outline,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: t.font.hanken.regular,
    marginTop: 4,
  },
  clubPickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
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
  keyReveal: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: t.radiusMain,
    backgroundColor: t.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: t.surfaceContainerHigh,
  },
  keyLabel: {
    color: t.outline,
    ...t.type.labelSm,
    fontFamily: t.font.space.bold,
    letterSpacing: 1,
  },
  keyCode: {
    color: t.text,
    fontSize: 22,
    fontFamily: t.font.space.bold,
    letterSpacing: 2,
    marginTop: 4,
  },
  keyLink: {
    color: t.textSecondary,
    fontSize: 12,
    fontFamily: t.font.hanken.regular,
    marginTop: 4,
    maxWidth: 220,
  },
  copyButton: {
    borderWidth: 1,
    borderColor: t.outlineVariant,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: t.radiusChip,
    backgroundColor: t.card,
  },
  copyButtonText: {
    color: t.text,
    fontSize: 13,
    fontFamily: t.font.space.semibold,
  },
  textLinkWrap: {
    marginTop: 12,
    paddingVertical: 4,
  },
  textLink: {
    color: t.primary,
    fontSize: 14,
    fontFamily: t.font.space.semibold,
  },
  knockForm: {
    marginTop: 12,
  },
  knockHint: {
    color: t.outline,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: t.font.hanken.regular,
    marginBottom: 10,
  },
  createWrap: {
    marginTop: 8,
    alignItems: "center",
    paddingVertical: 8,
  },
  createText: {
    color: t.textSecondary,
    fontSize: 15,
    fontFamily: t.font.space.semibold,
  },
  presenceBlock: {
    paddingTop: 8,
  },
});
