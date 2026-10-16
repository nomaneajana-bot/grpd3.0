import { PACE_REFERENCES, type PaceReference } from "@/lib/paceFormat";

/** Nearest pace reference card for a continuous slider value (single source of truth). */
export function nearestPaceReference(paceMinutes: number): PaceReference {
  let best = PACE_REFERENCES[0]!;
  let bestDist = Math.abs(paceMinutes - best.minutes);
  for (const ref of PACE_REFERENCES) {
    const d = Math.abs(paceMinutes - ref.minutes);
    if (d < bestDist) {
      best = ref;
      bestDist = d;
    }
  }
  return best;
}
