import React from "react";
import { StyleSheet, View } from "react-native";

import { redesignTheme } from "@/constants/redesignTheme";

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
    marginHorizontal: redesignTheme.screen.horizontalPadding,
    backgroundColor: redesignTheme.card.background,
    borderRadius: redesignTheme.card.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: redesignTheme.card.hairline,
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: redesignTheme.card.hairline,
    marginLeft: 16,
  },
});
