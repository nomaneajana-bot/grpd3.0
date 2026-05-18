import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";
import {
  getWorkoutBuilderAdvice,
  type CoachContext,
} from "@/lib/coach";
import { getRunTypeLabel } from "@/lib/workoutStore";

export type CoachBuilderAskCardProps = {
  runType: string;
};

function quickLabelsForRunType(rt: string): string[] {
  const u = rt.toLowerCase();
  if (u.includes("fartlek"))
    return [
      "Combien de répétitions ?",
      "À quelle allure ?",
      "Durée idéale ?",
    ];
  if (u.includes("tempo"))
    return ["Durée recommandée ?", "Échauffement nécessaire ?"];
  if (u.includes("interval"))
    return ["Distance des répétitions ?", "Temps de récup ?"];
  return ["Conseil du jour", "Allure"];
}

export function CoachBuilderAskCard({ runType }: CoachBuilderAskCardProps) {
  const [answer, setAnswer] = useState<string | undefined>(undefined);
  const [shown, setShown] = useState("");

  const context: CoachContext = useMemo(
    () => ({
      screen: "workout_builder",
      sessionType: String(runType),
    }),
    [runType],
  );

  const labels = useMemo(
    () => quickLabelsForRunType(String(runType)),
    [runType],
  );
  const runTypeLabel = getRunTypeLabel(runType as Parameters<typeof getRunTypeLabel>[0]);

  const onSelect = (label: string) => {
    const reply = getWorkoutBuilderAdvice(label, context);
    setAnswer(reply.message);
  };

  useEffect(() => {
    if (!answer) {
      setShown("");
      return;
    }
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(answer.slice(0, i));
      if (i >= answer.length) clearInterval(id);
    }, 12);
    return () => clearInterval(id);
  }, [answer]);

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>YA</Text>
        </View>
        <View style={styles.headCopy}>
          <Text style={styles.headTitle}>Demande au coach</Text>
          <Text style={styles.headSub}>
            {runTypeLabel} · ta méthode
          </Text>
        </View>
        <View style={styles.onlineDot} />
      </View>

      <View style={styles.actions}>
        {labels.map((label) => (
          <Pressable
            key={label}
            style={({ pressed }) => [
              styles.btn,
              pressed && styles.pressed,
            ]}
            onPress={() => onSelect(label)}
          >
            <Text style={styles.btnTxt}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {answer ? <Text style={styles.answer}>{shown}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.tag.greenBg,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: "rgba(77, 217, 144, 0.45)",
    padding: 14,
    marginBottom: 12,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(77, 217, 144, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarTxt: {
    fontSize: typography.sizes.sm,
    fontWeight: "700",
    color: colors.tag.greenText,
  },
  headCopy: { flex: 1 },
  headTitle: {
    fontSize: typography.sizes.md,
    fontWeight: "700",
    color: colors.tag.greenText,
  },
  headSub: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tag.greenText,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  btn: {
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 100,
    borderRadius: borderRadius.md,
    borderWidth: hairline,
    borderColor: "rgba(77, 217, 144, 0.5)",
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  pressed: { opacity: 0.85 },
  btnTxt: {
    color: colors.tag.greenText,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
    textAlign: "center",
  },
  answer: {
    marginTop: 12,
    fontSize: typography.sizes.md,
    lineHeight: 22,
    color: colors.text.primary,
  },
});
