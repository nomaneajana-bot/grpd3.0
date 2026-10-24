import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { stitoTheme as t } from "@/constants/stitoTheme";

type Props = {
  visibility: "public" | "members" | null | undefined;
};

/** Stitch accès row — check mark + one quiet sentence. */
export function StitoAccessNote({ visibility }: Props) {
  const members = visibility === "members";
  return (
    <View style={styles.row} testID="stito-access-note">
      <Ionicons
        name={members ? "lock-closed" : "checkmark-circle"}
        size={20}
        color={t.primary}
        style={styles.icon}
      />
      <Text style={styles.text}>
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
    alignItems: "flex-start",
    gap: 10,
  },
  icon: { marginTop: 2 },
  text: {
    flex: 1,
    fontFamily: t.font.hanken.regular,
    fontSize: 15,
    lineHeight: 21,
    color: t.textSecondary,
  },
});
