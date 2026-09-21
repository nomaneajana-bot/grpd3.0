import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';

export const experienceTheme = { bg: '#111214', card: '#1C1E21', text: '#F3F2ED', muted: '#B1B2B6', accent: '#C3D5B3', line: '#383B40' };
export function TrailArt({ color = experienceTheme.accent }: { color?: string }) {
  return <View pointerEvents="none" style={{ position: 'absolute', right: -25, bottom: -30, width: 220, height: 220, opacity: 0.5 }}>
    <Svg viewBox="0 0 220 220" width="100%" height="100%"><Path d="M230 20 C70 -20 30 80 140 90 S230 185 90 150 S20 220 110 250" fill="none" stroke={color} strokeWidth="2" /><Path d="M230 40 C90 0 50 70 145 72 S250 205 85 168 S40 230 105 250" fill="none" stroke={color} strokeWidth="1" /><Circle cx="139" cy="90" r="7" fill={color}/><Circle cx="77" cy="155" r="5" fill={color}/></Svg>
  </View>;
}
export function Action({ label, onPress, secondary = false, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[ui.action, secondary && ui.secondaryAction, disabled && { opacity: 0.5 }]}><Text style={[ui.actionText, secondary && { color: experienceTheme.text }]}>{label}</Text></Pressable>;
}
export function Back({ onPress }: { onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={onPress} style={ui.back}><Ionicons name="arrow-back" size={23} color={experienceTheme.text}/></Pressable>;
}
export const ui = StyleSheet.create({
  safe: { flex: 1, backgroundColor: experienceTheme.bg },
  content: { padding: 24, paddingBottom: 40, width: '100%', maxWidth: 960, alignSelf: 'center', gap: 22 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  eyebrow: { color: experienceTheme.accent, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  title: { color: experienceTheme.text, fontSize: 32, lineHeight: 38, letterSpacing: -1.4, fontWeight: '600' },
  heading: { color: experienceTheme.text, fontSize: 23, fontWeight: '600', letterSpacing: -0.5 },
  body: { color: experienceTheme.muted, fontSize: 16, lineHeight: 24 },
  card: { backgroundColor: experienceTheme.card, borderRadius: 22, padding: 22, gap: 14, borderWidth: 1, borderColor: experienceTheme.line },
  input: { color: experienceTheme.text, backgroundColor: experienceTheme.card, borderWidth: 1, borderColor: experienceTheme.line, borderRadius: 14, padding: 16, fontSize: 16 },
  label: { color: experienceTheme.text, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  chip: { borderRadius: 25, borderWidth: 1, borderColor: experienceTheme.line, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 7 },
  chipOn: { backgroundColor: experienceTheme.accent, borderColor: experienceTheme.accent },
  chipText: { color: experienceTheme.muted, fontSize: 13, fontWeight: '600' },
  action: { backgroundColor: experienceTheme.accent, padding: 17, borderRadius: 16, alignItems: 'center' },
  secondaryAction: { backgroundColor: experienceTheme.card, borderWidth: 1, borderColor: experienceTheme.line },
  actionText: { color: experienceTheme.bg, fontSize: 15, fontWeight: '700' },
  back: { padding: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: experienceTheme.line, borderRadius: 30 },
  error: { color: '#FFB7AA', fontSize: 14, lineHeight: 21 },
});
