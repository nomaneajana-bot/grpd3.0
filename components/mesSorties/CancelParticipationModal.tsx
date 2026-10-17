import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { stitoTheme as t } from "@/constants/stitoTheme";

type Props = {
  visible: boolean;
  title: string;
  busy?: boolean;
  onConfirm: () => void;
  onKeep: () => void;
};

export function CancelParticipationModal({
  visible,
  title,
  busy,
  onConfirm,
  onKeep,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onKeep}
    >
      <View style={styles.backdrop} testID="mes-sorties-cancel-modal">
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <View style={styles.iconWrap}>
              <Ionicons name="calendar-outline" size={24} color={t.error} />
            </View>
            <View style={styles.headText}>
              <Text style={styles.headTitle}>Annuler ma participation ?</Text>
              <Text style={styles.headSub} numberOfLines={2}>
                {title}
              </Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Ionicons
              name="people-outline"
              size={18}
              color={t.textSecondary}
              style={{ marginTop: 2 }}
            />
            <Text style={styles.infoText}>
              Tu annules uniquement ta participation personnelle. La sortie reste
              maintenue pour les autres participants de la communauté.
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirmer l'annulation"
              onPress={onConfirm}
              disabled={busy}
              style={({ pressed }) => [
                styles.confirmBtn,
                pressed && { opacity: 0.9 },
                busy && { opacity: 0.7 },
              ]}
              testID="mes-sorties-cancel-confirm"
            >
              {busy ? (
                <ActivityIndicator color={t.onErrorContainer} />
              ) : (
                <>
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={t.onErrorContainer}
                  />
                  <Text style={styles.confirmText}>Confirmer l'annulation</Text>
                </>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Garder ma place"
              onPress={onKeep}
              disabled={busy}
              style={({ pressed }) => [
                styles.keepBtn,
                pressed && { opacity: 0.9 },
              ]}
              testID="mes-sorties-cancel-keep"
            >
              <Text style={styles.keepText}>Garder ma place</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  sheet: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: t.surfaceContainerLowest,
    borderRadius: 24,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: t.surfaceContainerHigh,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: t.surfaceContainerHighest,
    alignSelf: "center",
  },
  head: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,218,214,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  headText: { flex: 1, minWidth: 0, gap: 2 },
  headTitle: { ...t.type.section, color: t.text, fontSize: 18 },
  headSub: {
    ...t.type.labelMd,
    color: t.primary,
    fontFamily: t.font.space.bold,
  },
  infoBox: {
    backgroundColor: t.surfaceContainerLow,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    gap: 10,
  },
  infoText: { ...t.type.bodySm, color: t.textSecondary, flex: 1, fontSize: 12 },
  actions: { gap: 10, paddingTop: 4 },
  confirmBtn: {
    minHeight: 48,
    borderRadius: t.radiusChip,
    backgroundColor: t.errorContainer,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
  },
  confirmText: {
    ...t.type.labelMd,
    color: t.onErrorContainer,
    fontFamily: t.font.space.bold,
  },
  keepBtn: {
    minHeight: 48,
    borderRadius: t.radiusChip,
    backgroundColor: t.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  keepText: {
    ...t.type.labelMd,
    color: t.text,
    fontFamily: t.font.space.semibold,
  },
});
