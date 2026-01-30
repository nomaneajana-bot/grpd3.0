import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { borderRadius, colors, spacing } from "../../constants/ui";
import type { ToastVariant } from "../../hooks/useToast";

type ToastProps = {
  message: string;
  variant?: ToastVariant;
  onDismiss?: () => void;
  style?: ViewStyle;
};

const variantStyles: Record<
  ToastVariant,
  { borderColor: string; backgroundColor: string }
> = {
  info: {
    borderColor: colors.accent.primary,
    backgroundColor: "rgba(32, 129, 255, 0.16)",
  },
  success: {
    borderColor: colors.accent.success,
    backgroundColor: "rgba(41, 208, 126, 0.16)",
  },
  error: {
    borderColor: colors.accent.error,
    backgroundColor: "rgba(255, 59, 48, 0.16)",
  },
};

export function Toast({
  message,
  variant = "info",
  onDismiss,
  style,
}: ToastProps) {
  return (
    <Pressable
      onPress={onDismiss}
      style={[styles.container, style]}
      accessibilityRole="alert"
    >
      <View style={[styles.toast, variantStyles[variant]]}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: spacing.xxl + spacing.sm,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 50,
  },
  toast: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
