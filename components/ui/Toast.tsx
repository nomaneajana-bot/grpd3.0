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
  /** Light canvas (Stito outing detail): ink text, solid card, top placement. */
  tone?: "default" | "onLight";
  /** Prefer top so sticky join CTAs stay clear. */
  placement?: "bottom" | "top";
};

const darkVariantStyles: Record<
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

const lightVariantStyles: Record<
  ToastVariant,
  { borderColor: string; backgroundColor: string }
> = {
  info: {
    borderColor: "#005F34",
    backgroundColor: "#FFFFFF",
  },
  success: {
    borderColor: "#005F34",
    backgroundColor: "#EAF2EC",
  },
  error: {
    borderColor: "#BA1A1A",
    backgroundColor: "#FFDAD6",
  },
};

export function Toast({
  message,
  variant = "info",
  onDismiss,
  style,
  tone = "default",
  placement = "bottom",
}: ToastProps) {
  const onLight = tone === "onLight";
  const variantStyles = onLight ? lightVariantStyles : darkVariantStyles;
  return (
    <Pressable
      onPress={onDismiss}
      style={[
        styles.container,
        placement === "top" ? styles.containerTop : styles.containerBottom,
        style,
      ]}
      accessibilityRole="alert"
      testID="app-toast"
    >
      <View style={[styles.toast, variantStyles[variant]]}>
        <Text style={[styles.text, onLight && styles.textOnLight]}>
          {message}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 50,
    alignItems: "center",
  },
  containerBottom: {
    // Sit above primary CTAs / tab bar so join·leave controls stay tappable
    bottom: spacing.xl + spacing.lg + 72,
  },
  containerTop: {
    top: spacing.xl + spacing.md,
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
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  textOnLight: {
    color: "#1A1C1D",
  },
});
