/**
 * Lightweight Accueil → tab-bar badge bridge (upcoming confirmed joins).
 * Avoids loading session catalogs inside the tab layout.
 */
type Listener = (count: number) => void;

let upcomingCount = 0;
const listeners = new Set<Listener>();

export function getMesSortiesBadgeCount(): number {
  return upcomingCount;
}

export function setMesSortiesBadgeCount(count: number): void {
  const next = Math.max(0, Math.floor(count));
  if (next === upcomingCount) return;
  upcomingCount = next;
  listeners.forEach((l) => l(upcomingCount));
}

export function subscribeMesSortiesBadge(listener: Listener): () => void {
  listeners.add(listener);
  listener(upcomingCount);
  return () => {
    listeners.delete(listener);
  };
}
