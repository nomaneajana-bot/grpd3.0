// Reusable Card component

import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors, borderRadius, hairline } from "@/constants/ui";

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function Card({ children, style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    paddingHorizontal: 13,
    paddingVertical: 13,
    marginBottom: 9,
  },
});
