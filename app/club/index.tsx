import { router, Stack } from "expo-router";
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

import * as Haptics from "expo-haptics";

import { Card } from "../../components/ui/Card";
import { Toast } from "../../components/ui/Toast";
import { colors, spacing } from "../../constants/ui";
import { useToast } from "../../hooks/useToast";
import {
  createApiClient,
  getMyMemberships,
  joinClubByCode,
  requestClubJoin,
} from "../../lib/api";
import type { ClubMembership } from "../../types/api";

export default function ClubScreen() {
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [clubId, setClubId] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      showToast(
        "Impossible de charger tes clubs. Vérifie l'API.",
        "error",
      );
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
  const roleLabel =
    primaryMembership?.role === "admin"
      ? "Admin"
      : primaryMembership?.role === "coach"
        ? "Coach"
        : primaryMembership?.role === "member"
          ? "Membre"
          : null;

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
    if (!clubId.trim()) {
      showToast("Ajoute l'identifiant du club.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const client = createApiClient();
      await requestClubJoin(client, clubId.trim(), {
        message: requestMessage.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Demande envoyée.", "success");
      setClubId("");
      setRequestMessage("");
      await loadMemberships();
    } catch (error) {
      console.warn("Request join failed:", error);
      showToast(
        "Impossible d'envoyer la demande. Vérifie l'API.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
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

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Retour</Text>
        </Pressable>
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Club / Communauté</Text>
          <Pressable
            onPress={loadMemberships}
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && styles.refreshButtonPressed,
            ]}
          >
            <Text style={styles.refreshButtonText}>Rafraîchir</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.cardLabel}>CLUB ACTUEL</Text>
          {isLoading ? (
            <Text style={styles.cardValue}>Chargement...</Text>
          ) : primaryMembership?.club?.name ? (
            <>
              <View style={styles.clubHeaderRow}>
                <Text style={styles.cardValue}>
                  {primaryMembership.club.name}
                </Text>
                {roleLabel && (
                  <View style={styles.rolePill}>
                    <Text style={styles.rolePillText}>{roleLabel}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardSubtext}>
                Statut :{" "}
                {isApprovedMember
                  ? "Membre"
                  : isPendingMember
                    ? "En attente"
                    : "Non actif"}
              </Text>
            </>
          ) : (
            <Text style={styles.cardValue}>Aucun club pour l’instant.</Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardLabel}>REJOINDRE AVEC CODE</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Code d’invitation</Text>
            <TextInput
              style={styles.textInput}
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="Ex: JAIME123"
              placeholderTextColor="#666"
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
              Tu es déjà membre d’un club.
            </Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardLabel}>DEMANDER À REJOINDRE</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Identifiant du club</Text>
            <TextInput
              style={styles.textInput}
              value={clubId}
              onChangeText={setClubId}
              placeholder="ID ou slug"
              placeholderTextColor="#666"
              autoCapitalize="none"
              editable={!isInClub}
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Message (optionnel)</Text>
            <TextInput
              style={styles.textInput}
              value={requestMessage}
              onChangeText={setRequestMessage}
              placeholder="Pourquoi tu veux rejoindre ?"
              placeholderTextColor="#666"
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
              Un admin doit valider ta demande.
            </Text>
          )}
          {isApprovedMember && (
            <Text style={styles.helperText}>
              Pour changer de club, contacte ton admin.
            </Text>
          )}
        </Card>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  backIcon: {
    color: colors.text.accent,
    fontSize: 18,
    marginRight: 6,
  },
  backLabel: {
    color: colors.text.accent,
    fontSize: 16,
    fontWeight: "500",
  },
  screenTitle: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: "700",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  refreshButton: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  refreshButtonPressed: {
    opacity: 0.8,
  },
  refreshButtonText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: spacing.lg,
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
  cardValue: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  cardSubtext: {
    color: colors.text.secondary,
    fontSize: 13,
    marginTop: 6,
  },
  clubHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rolePill: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  rolePillText: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: "600",
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
  helperText: {
    color: colors.text.tertiary,
    fontSize: 12,
    marginTop: 8,
  },
});
