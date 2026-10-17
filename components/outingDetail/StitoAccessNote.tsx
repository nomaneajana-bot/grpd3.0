import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { stitoTheme as t } from "@/constants/stitoTheme";

type Props = {
  visibility: "public" | "members" | null | undefined;
};

/** Honest access note — no verified/VIP badges. */
export function StitoAccessNote({ visibility }: Props) {
  const members = visibility === "members";
  return (
    <View
      style={[styles.box, members && styles.boxMembers]}
      testID="stito-access-note"
    >
      <Ionicons
        name={members ? "lock-closed-outline" : "shield-checkmark-outline"}
        size={18}
        color={t.primary}
        style={{ marginTop: 2 }}
      />
      <Text style={styles.text}>
        {members ? (
          <>
            Sortie <Text style={styles.strong}>réservée aux membres</Text> du
            club. L&apos;inscription et le lieu exact suivent les règles du
            club.
          </>
        ) : (
          <>
            Tu n&apos;as <Text style={styles.strong}>pas besoin</Text>{" "}
            d&apos;adhérer au club pour t&apos;inscrire à cette session
            publique.
          </>
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: t.surfaceContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  boxMembers: {
    backgroundColor: t.surfaceContainerLow,
  },
  text: {
    flex: 1,
    fontFamily: t.font.hanken.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: t.textSecondary,
  },
  strong: {
    fontFamily: t.font.hanken.semibold,
    color: t.text,
  },
});
