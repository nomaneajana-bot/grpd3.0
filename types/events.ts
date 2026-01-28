// Event type definitions for React Native components

import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

/**
 * Scroll end event for FlatList/ScrollView momentum scroll end handlers
 */
export type ScrollEndEvent = NativeSyntheticEvent<NativeScrollEvent>;

/**
 * Type guard to check if event has the expected structure
 */
export function isScrollEndEvent(event: unknown): event is ScrollEndEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'nativeEvent' in event &&
    typeof (event as { nativeEvent: unknown }).nativeEvent === 'object' &&
    (event as { nativeEvent: { contentOffset?: unknown } }).nativeEvent !== null &&
    'contentOffset' in (event as { nativeEvent: { contentOffset: unknown } }).nativeEvent
  );
}
