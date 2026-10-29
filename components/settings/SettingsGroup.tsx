import React from "react";
import { StyleSheet, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

type SettingsGroupProps = {
  children: React.ReactNode;
};

export function SettingsGroup({ children }: SettingsGroupProps) {
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
    backgroundColor: t.card,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(190,202,190,0.4)",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(190,202,190,0.55)",
    marginLeft: 16,
  },
});
