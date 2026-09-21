import { router, Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import {
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

import * as Haptics from "expo-haptics";

import { Toast } from "@/components/ui/Toast";
import { borderRadius, colors, hairline } from "@/constants/ui";
import { useToast } from "@/hooks/useToast";
import {
  getClubInitials,
  labelToClubCategory,
  MAQUETTE_ACCESS_OPTIONS,
  MAQUETTE_CLUB_TYPES,
  maquetteAccessToApi,
  type MaquetteAccessType,
  type MaquetteClubTypeLabel,
} from "@/lib/clubMetadata";
import { createApiClient, createClub } from "@/lib/api";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function TypeChip({
  label,
  selected,
  onPress,
}: {
  label: MaquetteClubTypeLabel;
  selected: boolean;
  onPress: () => void;
}) {
  const isFemmes = label === "100% Femmes";
  return (
    <Pressable
      style={[
        styles.chip,
        selected && (isFemmes ? styles.chipOnTeal : styles.chipOn),
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.chipText,
          selected && (isFemmes ? styles.chipTextTeal : styles.chipTextOn),
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function AccessOption({
  option,
  selected,
  onPress,
}: {
  option: (typeof MAQUETTE_ACCESS_OPTIONS)[number];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.accessOpt, selected && styles.accessOptOn]}
      onPress={onPress}
    >
      <Text style={[styles.accessLabel, selected && styles.accessLabelOn]}>
        {option.label}
      </Text>
      <Text style={styles.accessSub} numberOfLines={2}>
        {option.sub}
      </Text>
    </Pressable>
  );
}

export default function ClubCreateScreen() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [clubType, setClubType] = useState<MaquetteClubTypeLabel>("Mixte");
  const [accessType, setAccessType] = useState<MaquetteAccessType>("invitation");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const initials = useMemo(() => getClubInitials(name), [name]);
  const canCreate = name.trim().length >= 2;

  const handleSubmit = async () => {
    if (!canCreate) {
      showToast("Ajoute un nom de club (2 caractères min.).", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const { joinMode, visibility } = maquetteAccessToApi(accessType);
      const client = createApiClient();
      await createClub(client, {
        name: name.trim(),
        city: city.trim() || null,
        description: description.trim() || null,
        clubCategory: labelToClubCategory(clubType),
        joinMode,
        visibility,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/club");
    } catch (error) {
      console.warn("Create club failed:", error);
      showToast("Impossible de créer le club. Réessaie.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <Pressable onPress={() => router.back()} style={styles.navBack}>
          <Text style={styles.navBackText}>← Retour</Text>
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Créer un club</Text>
            <Text style={styles.subtitle}>
              Configure ton espace, invite tes membres, gère tes groupes.
            </Text>
          </View>

          <View style={styles.previewCard}>
            <View style={styles.previewAvatar}>
              <Text style={styles.previewAvatarText}>{initials || "—"}</Text>
            </View>
            <View style={styles.previewInfo}>
              <Text style={styles.previewLabel}>APERÇU</Text>
              <Text
                style={[styles.previewName, !name && styles.previewNameMuted]}
                numberOfLines={1}
              >
                {name.trim() || "Nom de ton club"}
              </Text>
              <Text style={styles.previewMeta}>
                {city.trim() || "Ville"} · {clubType} · 0 membres
              </Text>
            </View>
          </View>

          <View style={styles.field}>
            <SectionLabel>Une idée pour commencer</SectionLabel>
            <Text style={{ color: colors.text.secondary, lineHeight: 21, marginBottom: 12 }}>Un club, c’est une raison de se retrouver. Choisis une idée pour commencer ta présentation.</Text>
            <View style={styles.chipsRow}>
              {[
                ['Communauté', 'Un rendez-vous régulier pour marcher ou courir ensemble dans notre quartier.'],
                ['Langues', 'Un club pour pratiquer une langue en marchant ou en courant à une allure de conversation.'],
                ['Après Fajr', 'Après salat Fajr, une marche tranquille pour commencer la journée ensemble. L’heure est confirmée pour chaque sortie.'],
                ['Entrepreneurs', 'Des marches pour échanger entre entrepreneurs, partager nos questions et nos expériences.'],
              ].map(([label, copy]) => <Pressable key={label} accessibilityRole="button" disabled={isSubmitting} style={styles.chip} onPress={() => setDescription(copy)}><Text style={styles.chipText}>{label}</Text></Pressable>)}
            </View>
          </View>

          <View style={styles.field}>
            <SectionLabel>Nom du club</SectionLabel>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="ex: Darija Walk & Talk"
              placeholderTextColor={colors.text.tertiary}
              autoCapitalize="words"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.field}>
            <SectionLabel>
              Ville{"  "}
              <Text style={styles.optional}>(optionnel)</Text>
            </SectionLabel>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="ex: Casablanca"
              placeholderTextColor={colors.text.tertiary}
              autoCapitalize="words"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.field}>
            <SectionLabel>Public et pratique du club</SectionLabel>
            <View style={styles.chipsRow}>
              {MAQUETTE_CLUB_TYPES.map((type) => (
                <TypeChip
                  key={type}
                  label={type}
                  selected={clubType === type}
                  onPress={() => setClubType(type)}
                />
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <SectionLabel>Accès</SectionLabel>
            <View style={styles.accessRow}>
              {MAQUETTE_ACCESS_OPTIONS.map((opt) => (
                <AccessOption
                  key={opt.key}
                  option={opt}
                  selected={accessType === opt.key}
                  onPress={() => setAccessType(opt.key)}
                />
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <SectionLabel>
              Description{"  "}
              <Text style={styles.optional}>(optionnel)</Text>
            </SectionLabel>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Séances techniques et régulières, tous niveaux bienvenus…"
              placeholderTextColor={colors.text.tertiary}
              multiline
              textAlignVertical="top"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.ctaBlock}>
            <Pressable
              style={[
                styles.btnPrimary,
                (!canCreate || isSubmitting) && styles.btnDisabled,
              ]}
              disabled={!canCreate || isSubmitting}
              onPress={() => void handleSubmit()}
            >
              <Text style={styles.btnPrimaryText}>
                {isSubmitting ? "Création…" : "Créer le club"}
              </Text>
            </Pressable>
            <Text style={styles.ctaNote}>
              Tu pourras configurer les groupes de pace après la création.
            </Text>
          </View>
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
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: colors.surface.s2,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    padding: 14,
    marginBottom: 22,
  },
  previewAvatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.primaryMid,
    borderWidth: 1.5,
    borderColor: colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  previewAvatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text.accent,
  },
  previewInfo: { flex: 1 },
  previewLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text.secondary,
    letterSpacing: 0.7,
    marginBottom: 3,
  },
  previewName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 2,
  },
  previewNameMuted: {
    color: colors.text.tertiary,
  },
  previewMeta: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  field: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.secondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  optional: {
    fontWeight: "400",
    color: colors.text.tertiary,
    textTransform: "none",
    letterSpacing: 0,
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
  textarea: {
    height: 80,
    paddingTop: 13,
    fontSize: 14,
    lineHeight: 21,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  chipOn: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  chipOnTeal: {
    backgroundColor: colors.tag.greenBg,
    borderColor: colors.accent.success,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  chipTextOn: {
    color: colors.text.onAccent,
  },
  chipTextTeal: {
    color: colors.tag.greenText,
  },
  accessRow: {
    flexDirection: "row",
    gap: 7,
  },
  accessOpt: {
    flex: 1,
    padding: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.s3,
    alignItems: "center",
  },
  accessOptOn: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primaryDim,
  },
  accessLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text.secondary,
    marginBottom: 3,
    textAlign: "center",
  },
  accessLabelOn: {
    color: colors.accent.primary,
  },
  accessSub: {
    fontSize: 10,
    color: colors.text.tertiary,
    textAlign: "center",
    lineHeight: 14,
  },
  ctaBlock: {
    marginTop: 4,
    gap: 10,
  },
  btnPrimary: {
    width: "100%",
    padding: 14,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.accent.primary,
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.38,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text.onAccent,
  },
  ctaNote: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 18,
  },
});
