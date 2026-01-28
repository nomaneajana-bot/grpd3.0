// Standardized Loading State component

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../constants/ui';

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = 'Chargement...' }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  text: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    marginTop: spacing.md,
  },
});
