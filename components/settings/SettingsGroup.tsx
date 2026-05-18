import React from "react";
import { StyleSheet, View } from "react-native";

import { profileTheme } from "@/constants/profileTheme";

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
    backgroundColor: profileTheme.cardBackground,
    borderRadius: profileTheme.cardRadius,
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginLeft: 16,
  },
});
