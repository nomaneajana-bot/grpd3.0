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
    borderColor: colors.accent.sage,
    backgroundColor: colors.accent.sageDim,
  },
  success: {
    borderColor: colors.accent.sage,
    backgroundColor: colors.accent.sageDim,
  },
  error: {
    borderColor: colors.text.error,
    backgroundColor: "rgba(255, 183, 170, 0.14)",
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
    // Sit above primary CTAs / tab bar so join·leave controls stay tappable
    bottom: spacing.xl + spacing.lg + 72,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 50,
    alignItems: "center",
  },
  toast: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: 520,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
