import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { stitoTheme as t } from "@/constants/stitoTheme";

type Props = {
  visibility: "public" | "members" | null | undefined;
};

/** Soft access banner — one quiet sentence, no hairline chrome. */
export function StitoAccessNote({ visibility }: Props) {
  const members = visibility === "members";
  return (
    <View
      style={[styles.row, members && styles.rowMembers]}
      testID="stito-access-note"
    >
      <View style={[styles.iconWrap, members && styles.iconWrapMembers]}>
        <Ionicons
          name={members ? "lock-closed" : "checkmark"}
          size={16}
          color={members ? t.textSecondary : t.primary}
        />
      </View>
      <Text style={[styles.text, members && styles.textMembers]}>
        {members
          ? "Réservée aux membres du club — l’inscription suit les règles du club."
          : "Ouverte à tous — pas besoin d’adhérer au club pour s’inscrire."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(154,246,183,0.22)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowMembers: {
    backgroundColor: t.surfaceContainerLow,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,95,52,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapMembers: {
    backgroundColor: "rgba(111,122,112,0.15)",
  },
  text: {
    flex: 1,
    fontFamily: t.font.hanken.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.onSecondaryContainer,
  },
  textMembers: {
    color: t.textSecondary,
  },
});
