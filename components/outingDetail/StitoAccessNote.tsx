import React from "react";
import { StyleSheet, Text } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

type Props = {
  visibility: "public" | "members" | null | undefined;
};

/** One quiet line — no lock-box chrome. */
export function StitoAccessNote({ visibility }: Props) {
  const members = visibility === "members";
  return (
    <Text style={styles.text} testID="stito-access-note">
      {members
        ? "Réservée aux membres du club — l’inscription suit les règles du club."
        : "Ouverte à tous — pas besoin d’adhérer au club pour s’inscrire."}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.textSecondary,
  },
});
