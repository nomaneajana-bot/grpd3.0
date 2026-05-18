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

import { Card } from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";
import { colors, spacing } from "@/constants/ui";
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
        "Impossible de rejoindre ce club. Vérifie le code ou l'API.",
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
        <Text style={styles.title}>Accès club</Text>
        <Text style={styles.subtitle}>
          Invitations, demandes et administration.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isCoachOrAdmin && (
          <Card style={styles.card}>
            <Text style={styles.cardLabel}>RESPONSABLE</Text>
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
            >
              <Text style={styles.secondaryButtonText}>
                Générer un code d&apos;invitation
              </Text>
            </Pressable>
            {generatedInviteCode && (
              <View style={styles.inviteRow}>
                <Text style={styles.inviteCode}>{generatedInviteCode}</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.copyButton,
                    pressed && styles.copyButtonPressed,
                  ]}
                  onPress={handleCopyInvite}
                >
                  <Text style={styles.copyButtonText}>Copier</Text>
                </Pressable>
              </View>
            )}
          </Card>
        )}

        <Card style={styles.card}>
          <Text style={styles.cardLabel}>REJOINDRE AVEC CODE</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Code d&apos;invitation</Text>
            <TextInput
              style={styles.textInput}
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="Ex: CRC2026"
              placeholderTextColor={colors.text.tertiary}
              autoCapitalize="characters"
              editable={!isApprovedMember}
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || isSubmitting || isApprovedMember) &&
                styles.primaryButtonPressed,
            ]}
            onPress={handleJoinByCode}
            disabled={isSubmitting || isApprovedMember}
          >
            <Text style={styles.primaryButtonText}>
              {isApprovedMember ? "Déjà membre" : "Rejoindre"}
            </Text>
          </Pressable>
          {isApprovedMember && (
            <Text style={styles.helperText}>
              Tu es déjà membre d&apos;un club.
            </Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardLabel}>DEMANDER À REJOINDRE</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nom du club</Text>
            <TextInput
              style={styles.textInput}
              value={clubSlug}
              onChangeText={setClubSlug}
              placeholder="Ex: Casablanca Running Club"
              placeholderTextColor={colors.text.tertiary}
              autoCapitalize="none"
              editable={!isInClub}
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
              placeholderTextColor={colors.text.tertiary}
              autoCapitalize="sentences"
              editable={!isInClub}
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              (pressed || isSubmitting) && styles.secondaryButtonPressed,
            ]}
            onPress={handleRequestJoin}
            disabled={isSubmitting || isInClub}
          >
            <Text style={styles.secondaryButtonText}>
              {isPendingMember
                ? "Demande en attente"
                : isApprovedMember
                  ? "Déjà membre"
                  : "Envoyer la demande"}
            </Text>
          </Pressable>
          {isPendingMember && (
            <Text style={styles.helperText}>
              Un responsable du club doit valider ta demande.
            </Text>
          )}
        </Card>

        {!isApprovedMember && (
          <Card style={styles.card}>
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
            >
              <Text style={styles.createButtonText}>Créer un club</Text>
            </Pressable>
          </Card>
        )}

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
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 10,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backIcon: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: "300",
    marginRight: 4,
  },
  backLabel: {
    color: colors.text.secondary,
    fontSize: 15,
    fontWeight: "600",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  cardLabel: {
    color: colors.text.tertiary,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  fieldRow: {
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    color: colors.text.secondary,
    fontSize: 13,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: colors.background.input,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text.primary,
    fontSize: 14,
  },
  primaryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent.primary,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryButtonPressed: {
    opacity: 0.8,
  },
  primaryButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    marginTop: spacing.sm,
    borderColor: colors.border.medium,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  secondaryButtonPressed: {
    opacity: 0.8,
  },
  secondaryButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  createButton: {
    marginTop: spacing.sm,
    borderColor: colors.border.medium,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  createButtonPressed: {
    opacity: 0.8,
  },
  createButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  inviteRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.background.input,
  },
  inviteCode: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  copyButton: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  copyButtonPressed: {
    opacity: 0.8,
  },
  copyButtonText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  helperText: {
    color: colors.text.tertiary,
    fontSize: 12,
    marginTop: 8,
  },
});
