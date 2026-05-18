import type { TestRecord } from "./profileStore";
import { formatDurationLabel } from "./testHelpers";

/** Stable key for grouping PRs by distance bucket. */
export function prDistanceKey(test: TestRecord): string | null {
  if (test.distanceMeters == null || test.distanceMeters <= 0) return null;
  const m = test.distanceMeters;
  if (m >= 9900 && m <= 10100) return "10k";
  if (m >= 4900 && m <= 5100) return "5k";
  if (m >= 190 && m <= 210) return "200m";
  if (m >= 900 && m <= 1100) return "1k";
  if (m >= 20900 && m <= 21100) return "semi";
  if (m >= 41900 && m <= 42100) return "marathon";
  return `d${m}`;
}

export function formatRecordKicker(test: TestRecord): string {
  const key = prDistanceKey(test);
  if (key === "10k") return "RECORD · 10 KM";
  if (key === "5k") return "RECORD · 5 KM";
  if (key === "200m") return "RECORD · 200 M";
  if (key === "1k") return "RECORD · 1 KM";
  if (key === "semi") return "RECORD · SEMI";
  if (key === "marathon") return "RECORD · MARATHON";
  if (test.distanceMeters != null) {
    if (test.distanceMeters >= 1000) {
      const km = test.distanceMeters / 1000;
      return km % 1 === 0
        ? `RECORD · ${km} KM`
        : `RECORD · ${km.toFixed(1)} KM`;
    }
    return `RECORD · ${test.distanceMeters} M`;
  }
  return "RECORD";
}

/** Find the previous slower PR on the same distance (by test date / createdAt). */
export function getPreviousPr(
  test: TestRecord,
  allTests: TestRecord[],
): TestRecord | null {
  const key = prDistanceKey(test);
  if (!key || test.durationSeconds == null) return null;

  const same = allTests
    .filter((t) => t.id !== test.id && prDistanceKey(t) === key)
    .filter((t) => t.durationSeconds != null && t.durationSeconds > 0)
    .sort((a, b) => {
      const da = a.testDate ?? "";
      const db = b.testDate ?? "";
      if (da !== db) return db.localeCompare(da);
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    });

  const currentDate = test.testDate ?? "";
  const older = same.filter((t) => {
    const d = t.testDate ?? "";
    return d < currentDate || (d === currentDate && (t.createdAt ?? 0) < (test.createdAt ?? 0));
  });

  return older[0] ?? same.find((t) => t.durationSeconds! > test.durationSeconds!) ?? null;
}

/** Delta vs previous: negative seconds = improvement (faster). */
export function formatPrDelta(
  test: TestRecord,
  allTests: TestRecord[],
): string | null {
  const prev = getPreviousPr(test, allTests);
  if (
    !prev?.durationSeconds ||
    test.durationSeconds == null ||
    test.durationSeconds <= 0
  ) {
    return null;
  }
  const delta = test.durationSeconds - prev.durationSeconds;
  if (delta === 0) return null;
  const sign = delta < 0 ? "−" : "+";
  const abs = Math.abs(delta);
  if (abs >= 60) {
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    return s > 0 ? `${sign}${m}:${s.toString().padStart(2, "0")}` : `${sign}${m} min`;
  }
  return `${sign}${abs}s`;
}

export function formatRecordTime(test: TestRecord): string {
  if (test.durationSeconds != null && test.durationSeconds > 0) {
    return formatDurationLabel(test.durationSeconds);
  }
  return "—";
}
