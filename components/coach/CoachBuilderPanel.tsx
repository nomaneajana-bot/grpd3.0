import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import type { RunTypeId } from "@/lib/workoutStore";
import { getWorkoutBuilderAdvice, type CoachContext } from "@/lib/coach";

import { CoachBubble } from "./CoachBubble";
import { CoachQuickReplies } from "./CoachQuickReplies";

export type CoachBuilderPanelProps = {
  runType: RunTypeId | string;
};

function quickLabelsForRunType(rt: string): string[] {
  const u = rt.toLowerCase();
  if (u.includes("fartlek"))
    return ["Combien de répét. ?", "À quelle allure ?", "Durée idéale ?"];
  if (u.includes("tempo"))
    return ["Durée recommandée ?", "Échauffement nécessaire ?", "Récupération après ?"];
  if (u.includes("interval"))
    return ["Distance des répétitions ?", "Temps de récup ?", "Nombre de séries ?"];
  return ["Conseil du jour", "Allure", "Volume"];
}

export function CoachBuilderPanel({ runType }: CoachBuilderPanelProps) {
  const [answer, setAnswer] = useState<string | undefined>(undefined);
  const [tw, setTw] = useState(false);

  const context: CoachContext = useMemo(
    () => ({
      screen: "workout_builder",
      sessionType: String(runType),
    }),
    [runType],
  );

  const labels = useMemo(() => quickLabelsForRunType(String(runType)), [runType]);

  const onSelect = (label: string) => {
    const reply = getWorkoutBuilderAdvice(label, context);
    setAnswer(reply.message);
    setTw(true);
  };

  return (
    <View style={styles.wrap}>
      <CoachBubble
        context="Coach workout"
        message="Pose une question rapide sur ce type de séance."
      />
      <CoachQuickReplies
        labels={labels}
        onSelect={onSelect}
        typewriterText={answer}
        typewriterActive={tw}
      />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { marginBottom: 8 } });
