// Design tokens - centralized colors, spacing, typography, and other design values

export const colors = {
  background: {
    primary: '#0B0B0B',
    card: '#131313',
    elevated: '#1A1A1A',
    input: '#11131A',
    inputDark: '#1C1C1C',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#BFBFBF',
    tertiary: '#8A8A8A',
    disabled: '#6F6F6F',
    accent: '#2081FF',
    warning: '#F8B319',
    success: '#29D07E',
    error: '#FF3B30',
  },
  accent: {
    primary: '#2081FF',
    success: '#29D07E',
    warning: '#F8B319',
    error: '#FF3B30',
  },
  border: {
    default: 'rgba(255, 255, 255, 0.06)',
    light: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.12)',
    active: 'rgba(255, 255, 255, 0.28)',
    accent: '#2081FF',
  },
  overlay: {
    backdrop: 'rgba(0, 0, 0, 0.75)',
    backdropLight: 'rgba(0, 0, 0, 0.6)',
  },
  pill: {
    default: '#1A2230',
    active: 'rgba(32, 129, 255, 0.15)',
    custom: 'rgba(191, 191, 191, 0.18)',
    success: 'rgba(41, 208, 126, 0.18)',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  header: 80, // Top padding for screens
  bottom: 120, // Bottom padding for scroll content
};

export const borderRadius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const typography = {
  sizes: {
    xs: 11,
    sm: 12,
    md: 14,
    base: 15,
    lg: 16,
    xl: 18,
    '2xl': 26,
    '3xl': 28,
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Common style patterns
export const commonStyles = {
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.pill.default,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  button: {
    primary: {
      backgroundColor: colors.accent.primary,
      borderRadius: borderRadius.pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: 14,
    },
    secondary: {
      borderRadius: borderRadius.pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
  },
};
