import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";
import { createApiClient, completeSession } from "@/lib/api";
import type { SessionData } from "@/lib/sessionData";
import {
  canMarkSessionComplete,
  isSessionPastForCompletion,
} from "@/lib/sessionCompletion";

export type SessionCompleteCardProps = {
  session: SessionData;
  hasLocalJoin: boolean;
  attendanceStatus?: SessionData["attendanceStatus"];
  onCompleted?: (status: "attended") => void;
};

export function SessionCompleteCard({
  session,
  hasLocalJoin,
  attendanceStatus,
  onCompleted,
}: SessionCompleteCardProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [km, setKm] = useState(
    session.estimatedDistanceKm > 0
      ? String(session.estimatedDistanceKm)
      : "",
  );
  const [durationMin, setDurationMin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = attendanceStatus ?? session.attendanceStatus;
  const isAttended = status === "attended";
  const showMarkDone = canMarkSessionComplete(session, {
    hasLocalJoin,
    attendanceStatus: status,
  });
  const showAttendedBadge =
    isAttended || (hasLocalJoin && isSessionPastForCompletion(session));

  if (!showMarkDone && !showAttendedBadge) return null;

  const handleSubmit = async () => {
    const parsedKm = parseFloat(km.replace(",", "."));
    if (!Number.isFinite(parsedKm) || parsedKm <= 0) {
      setError("Indique une distance en km.");
      return;
    }
    const parsedMin = durationMin.trim()
      ? parseInt(durationMin, 10)
      : undefined;
    if (
      durationMin.trim() &&
      (!Number.isFinite(parsedMin) || (parsedMin ?? 0) <= 0)
    ) {
      setError("Durée invalide (minutes).");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const client = createApiClient();
      await completeSession(client, session.id, {
        actualDistanceKm: parsedKm,
        actualDurationMin: parsedMin,
      });
      setModalVisible(false);
      onCompleted?.("attended");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Impossible d'enregistrer la séance.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {isAttended ? (
        <Text style={styles.doneLabel}>Séance marquée comme faite</Text>
      ) : (
        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.85}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.ctaText}>Marquer comme fait</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Séance terminée</Text>
            <Text style={styles.sheetHint}>
              Distance réelle (km) et durée optionnelle.
            </Text>
            <TextInput
              style={styles.input}
              value={km}
              onChangeText={setKm}
              keyboardType="decimal-pad"
              placeholder="Distance (km)"
              placeholderTextColor={colors.text.faint}
            />
            <TextInput
              style={styles.input}
              value={durationMin}
              onChangeText={setDurationMin}
              keyboardType="number-pad"
              placeholder="Durée (min, optionnel)"
              placeholderTextColor={colors.text.faint}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity
              style={[styles.submit, submitting && styles.submitDisabled]}
              disabled={submitting}
              onPress={() => void handleSubmit()}
            >
              <Text style={styles.submitText}>
                {submitting ? "Enregistrement…" : "Enregistrer"}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12, marginBottom: 8 },
  cta: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaText: {
    color: colors.text.onAccent,
    fontSize: typography.sizes.md,
    fontWeight: "700",
  },
  doneLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
    textAlign: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface.s1,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: 20,
    borderTopWidth: hairline,
    borderColor: colors.border.default,
  },
  sheetTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: "700",
    marginBottom: 6,
  },
  sheetHint: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginBottom: 14,
  },
  input: {
    borderWidth: hairline,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text.primary,
    marginBottom: 10,
    fontSize: typography.sizes.md,
  },
  error: {
    color: colors.accent.orange,
    fontSize: typography.sizes.sm,
    marginBottom: 8,
  },
  submit: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: {
    color: colors.text.onAccent,
    fontWeight: "700",
    fontSize: typography.sizes.md,
  },
});
