import type { TestRecord } from "./profileStore";
import { formatDurationLabel } from "./testHelpers";
import { prDistanceKey } from "./prHistory";

export type CoachPrediction = {
  id: string;
  distanceLabel: string;
  targetSeconds: number;
  targetDisplay: string;
  confidencePercent: number;
  basedOn: string;
};

const RIEGL_FACTOR: Record<string, number> = {
  "5k:10k": 0.95,
  "10k:5k": 1.06,
  "10k:semi": 2.1,
  "10k:marathon": 4.67,
};

function bestPr(
  tests: TestRecord[],
  key: string,
): TestRecord | null {
  const matches = tests.filter(
    (t) =>
      prDistanceKey(t) === key &&
      t.durationSeconds != null &&
      t.durationSeconds > 0,
  );
  if (matches.length === 0) return null;
  return matches.reduce((best, t) =>
    (t.durationSeconds ?? Infinity) < (best.durationSeconds ?? Infinity)
      ? t
      : best,
  );
}

export function buildCoachPredictions(tests: TestRecord[]): CoachPrediction[] {
  if (tests.length === 0) return [];

  const predictions: CoachPrediction[] = [];
  const tenK = bestPr(tests, "10k");
  const fiveK = bestPr(tests, "5k");

  if (tenK?.durationSeconds && !fiveK) {
    const factor = RIEGL_FACTOR["10k:5k"] ?? 1.06;
    const target = Math.round(tenK.durationSeconds / factor);
    predictions.push({
      id: "pred-5k",
      distanceLabel: "5 KM",
      targetSeconds: target,
      targetDisplay: formatDurationLabel(target),
      confidencePercent: tests.length >= 2 ? 78 : 62,
      basedOn: "Basé sur 10 km récent",
    });
  }

  if (tenK?.durationSeconds) {
    const factor = RIEGL_FACTOR["10k:semi"] ?? 2.1;
    const target = Math.round(tenK.durationSeconds * factor);
    predictions.push({
      id: "pred-semi",
      distanceLabel: "SEMI",
      targetSeconds: target,
      targetDisplay: formatDurationLabel(target),
      confidencePercent: tests.length >= 2 ? 62 : 48,
      basedOn:
        tests.length >= 2
          ? "Basé sur 10 km récent · constance"
          : "Basé sur 10 km récent",
    });
  }

  if (fiveK?.durationSeconds && !tenK) {
    const factor = RIEGL_FACTOR["5k:10k"] ?? 0.95;
    const target = Math.round(fiveK.durationSeconds / factor);
    predictions.push({
      id: "pred-10k",
      distanceLabel: "10 KM",
      targetSeconds: target,
      targetDisplay: formatDurationLabel(target),
      confidencePercent: 65,
      basedOn: "Basé sur 5 km récent",
    });
  }

  return predictions.slice(0, 3);
}

export function predictionsCaveat(testCount: number): string | null {
  if (testCount === 1) {
    return "Plus de précisions avec un 2e PR.";
  }
  return null;
}
