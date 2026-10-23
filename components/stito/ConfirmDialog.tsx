import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { stitoTheme as t } from "@/constants/stitoTheme";

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const iconName = destructive ? "warning-outline" : "help-circle-outline";
  const iconColor = destructive ? t.error : t.primary;
  const iconBg = destructive
    ? "rgba(255,218,214,0.7)"
    : "rgba(154,246,183,0.45)";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop} testID="stito-confirm-modal">
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
        />
        <View style={styles.sheet} accessibilityRole="alert">
          <View style={styles.handle} />
          <View style={styles.head}>
            <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
              <Ionicons name={iconName} size={24} color={iconColor} />
            </View>
            <View style={styles.headText}>
              <Text style={styles.headTitle}>{title}</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{message}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.confirmBtn,
                destructive ? styles.confirmDestructive : styles.confirmPrimary,
                pressed && { opacity: 0.9 },
              ]}
              testID="stito-confirm-ok"
            >
              <Text
                style={[
                  styles.confirmText,
                  destructive
                    ? styles.confirmTextDestructive
                    : styles.confirmTextPrimary,
                ]}
              >
                {confirmLabel}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && { opacity: 0.9 },
              ]}
              testID="stito-confirm-cancel"
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
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
    backgroundColor: "rgba(26,28,29,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  sheet: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: t.surfaceContainerLowest,
    borderRadius: t.radiusXl,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: t.surfaceContainerHigh,
    zIndex: 1,
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
    alignItems: "center",
    justifyContent: "center",
  },
  headText: { flex: 1, minWidth: 0 },
  headTitle: { ...t.type.section, color: t.text, fontSize: 18 },
  infoBox: {
    backgroundColor: t.surfaceContainerLow,
    borderRadius: 12,
    padding: 14,
  },
  infoText: { ...t.type.bodySm, color: t.textSecondary, fontSize: 13, lineHeight: 20 },
  actions: { gap: 10, paddingTop: 4 },
  confirmBtn: {
    minHeight: 48,
    borderRadius: t.radiusChip,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  confirmPrimary: { backgroundColor: t.primary },
  confirmDestructive: { backgroundColor: t.errorContainer },
  confirmText: {
    ...t.type.labelMd,
    fontFamily: t.font.space.bold,
  },
  confirmTextPrimary: { color: t.onPrimary },
  confirmTextDestructive: { color: t.onErrorContainer },
  cancelBtn: {
    minHeight: 48,
    borderRadius: t.radiusChip,
    backgroundColor: t.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  cancelText: {
    ...t.type.labelMd,
    color: t.text,
    fontFamily: t.font.space.semibold,
  },
});
