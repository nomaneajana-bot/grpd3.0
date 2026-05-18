import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { authTheme } from "@/constants/authTheme";
import { borderRadius, hairline, typography } from "@/constants/ui";

type ReturningDeviceBannerProps = {
  message?: string;
};

const DEFAULT_MESSAGE =
  "Tu reviens sur cet appareil — on t'a reconnu. Code SMS pour finir.";

export function ReturningDeviceBanner({
  message = DEFAULT_MESSAGE,
}: ReturningDeviceBannerProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconTile}>
        <Ionicons name="checkmark" size={16} color={authTheme.greenText} />
      </View>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 16,
    padding: 14,
    borderRadius: borderRadius.lg,
    backgroundColor: authTheme.greenSoft,
    borderWidth: hairline,
    borderColor: authTheme.greenBorder,
  },
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: authTheme.greenIconTileBg,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    color: authTheme.greenText,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    fontWeight: "500",
  },
});
