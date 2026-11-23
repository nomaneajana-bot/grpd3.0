import React from "react";
import { StyleSheet, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

type GroupedListProps = {
  children: React.ReactNode;
};

export function GroupedList({ children }: GroupedListProps) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.card}>
      {items.map((child, index) => (
        <React.Fragment key={index}>
          {index > 0 ? <View style={styles.divider} /> : null}
          {child}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(232,232,233,0.9)",
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.outlineVariant,
    marginLeft: 16,
  },
});
