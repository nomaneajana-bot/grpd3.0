import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { getPreSessionAdvice, type CoachContext } from "@/lib/coach";

import { CoachBubble } from "./CoachBubble";

export type CoachPreSessionCardProps = {
  context: CoachContext;
};

export function CoachPreSessionCard({ context }: CoachPreSessionCardProps) {
  const reply = useMemo(() => getPreSessionAdvice(context), [context]);
  return (
    <View style={styles.wrap}>
      <CoachBubble context="Avant la séance" message={reply.message} />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { marginBottom: 8 } });
