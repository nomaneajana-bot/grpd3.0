// Persistent AsyncStorage-based store for runner profile, reference paces, and test records

import AsyncStorage from "@react-native-async-storage/async-storage";
import { validateTestRecord } from "./storageSchemas";
import { formatDistanceLabel, formatDurationLabel } from "./testHelpers";

const PROFILE_KEY = "grpd_profile_v1";
const PACES_KEY = "grpd_reference_paces_v1";
const TESTS_KEY = "grpd_tests_v1";
const TEST_RECORDS_KEY = "grpd_test_records_v2"; // New key for dynamic tests

export type DistanceGoal = "5k" | "10k" | "21k" | "42k" | "other";

export type RunnerProfile = {
  name: string;
  groupName: string; // e.g. "Groupe D"
  clubName?: string | null; // e.g. "Jaime courir"
  vo2max: number | null; // nullable for now
  weightKg: number | null;
  mainGoal: DistanceGoal;
  sharePrsWithCoach?: boolean; // default true
  // Extended fields (backward compatible - all optional)
  firstName?: string;
  defaultGroup?: "A" | "B" | "C" | "D" | null;
  targetRaceType?: "5k" | "10k" | "half" | "marathon" | "other" | null;
  targetRaceLabel?: string | null; // used only when type === 'other'
  targetDeadline?: string | null; // ISO date or 'YYYY-MM' string
  targetSessionsPerWeek?: number | null;
  targetKmPerWeek?: number | null;
  customPrModels?: CustomPrModel[]; // Custom PR models stored with profile
};

export type CustomPrModel = {
  id: string;
  label: string;
  mode: "distance_fixed" | "duration_fixed";
  distanceMeters?: number | null;
  durationSeconds?: number | null;
  updatedAt: number; // Timestamp for sorting by most recently used
};

export type ReferencePaces = {
  // all values in seconds per km, nullable if not defined yet
  easyMin?: number | null;
  easyMax?: number | null;
  tempoMin?: number | null;
  tempoMax?: number | null;
  thresholdMin?: number | null;
  thresholdMax?: number | null;
  intervalsMin?: number | null;
  intervalsMax?: number | null;
};

export type TestType = "1min" | "200m" | "1k" | "5k" | "10k"; // Legacy support

export type TestRecordType = "distance" | "duration";

export type TestSourceType = "solo" | "official" | "training";

export type TestMode = "time_over_distance" | "distance_over_time";

export type TestRecord = {
  id: string; // uuid or timestamp-based
  kind: "distance" | "duration"; // Changed from 'type' to 'kind' for clarity
  label: string; // e.g., "200 m", "1 km", "1 minute", "5 minutes"
  mode?: TestMode; // Optional for backward compatibility: 'time_over_distance' | 'distance_in_time'
  distanceMeters: number | null; // Distance in meters (null for duration tests if not filled)
  durationSeconds: number | null; // Duration in seconds (null for distance tests if not filled)
  paceSecondsPerKm: number | null; // ALWAYS computed from distance + duration when both exist
  testDate: string | null; // YYYY-MM-DD
  testType: TestSourceType | null; // 'solo' | 'official' | 'training' | null
  createdAt?: number; // Timestamp for sorting
};

// Legacy type for backward compatibility
export type PaceTestRecord = {
  id: string;
  type: TestType;
  paceSecondsPerKm: number;
  dateISO: string;
  label: string;
  source: "test" | "race" | "training" | "solo";
  valueSeconds?: number | null;
  metricType?: "pace" | "time";
};

export type ProfileSnapshot = {
  profile: RunnerProfile | null;
  paces: ReferencePaces | null;
  tests: PaceTestRecord[];
};

// Helpers to parse / stringify safely
function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn("PROFILE_STORE_PARSE_ERROR", error);
    return null;
  }
}

// ---- Profile ----

export async function getRunnerProfile(): Promise<RunnerProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return safeParseJSON<RunnerProfile>(raw);
  } catch (error) {
    console.warn("PROFILE_STORE_GET_PROFILE_ERROR", error);
    return null;
  }
}

export async function saveRunnerProfile(profile: RunnerProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.warn("PROFILE_STORE_SAVE_PROFILE_ERROR", error);
  }
}

// ---- Reference paces ----

export async function getReferencePaces(): Promise<ReferencePaces | null> {
  try {
    const raw = await AsyncStorage.getItem(PACES_KEY);
    return safeParseJSON<ReferencePaces>(raw);
  } catch (error) {
    console.warn("PROFILE_STORE_GET_PACES_ERROR", error);
    return null;
  }
}

export async function saveReferencePaces(paces: ReferencePaces): Promise<void> {
  try {
    await AsyncStorage.setItem(PACES_KEY, JSON.stringify(paces));
  } catch (error) {
    console.warn("PROFILE_STORE_SAVE_PACES_ERROR", error);
  }
}

// ---- Tests & records ----

export async function getPaceTests(): Promise<PaceTestRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(TESTS_KEY);
    const parsed = safeParseJSON<PaceTestRecord[]>(raw);
    if (!parsed) return [];

    // sort most recent first by dateISO (and id fallback)
    return [...parsed].sort((a, b) => {
      if (a.dateISO === b.dateISO) {
        return b.id.localeCompare(a.id);
      }
      return b.dateISO.localeCompare(a.dateISO);
    });
  } catch (error) {
    console.warn("PROFILE_STORE_GET_TESTS_ERROR", error);
    return [];
  }
}

export async function upsertPaceTest(record: PaceTestRecord): Promise<void> {
  try {
    const existing = await getPaceTests();
    const idx = existing.findIndex((t) => t.id === record.id);
    let next: PaceTestRecord[];

    if (idx === -1) {
      next = [...existing, record];
    } else {
      next = [...existing];
      next[idx] = record;
    }

    await AsyncStorage.setItem(TESTS_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("PROFILE_STORE_UPSERT_TEST_ERROR", error);
  }
}

export async function deletePaceTest(id: string): Promise<void> {
  try {
    const existing = await getPaceTests();
    const next = existing.filter((t) => t.id !== id);
    await AsyncStorage.setItem(TESTS_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("PROFILE_STORE_DELETE_TEST_ERROR", error);
  }
}

// ---- Convenience: load everything at once ----

export async function getProfileSnapshot(): Promise<ProfileSnapshot> {
  const [profile, paces, tests] = await Promise.all([
    getRunnerProfile(),
    getReferencePaces(),
    getPaceTests(),
  ]);

  return { profile, paces, tests };
}

// ---- Custom PR Models ----

export async function getCustomPrModels(): Promise<CustomPrModel[]> {
  try {
    const profile = await getRunnerProfile();
    return profile?.customPrModels ?? [];
  } catch (error) {
    console.warn("PROFILE_STORE_GET_CUSTOM_PR_MODELS_ERROR", error);
    return [];
  }
}

export async function addCustomPrModel(model: CustomPrModel): Promise<void> {
  try {
    const profile = await getRunnerProfile();
    if (!profile) {
      console.warn("Cannot add custom PR model: no profile found");
      return;
    }

    const existing = profile.customPrModels ?? [];

    // Check if model with same label already exists
    const existingIndex = existing.findIndex((m) => m.label === model.label);

    let updated: CustomPrModel[];
    if (existingIndex >= 0) {
      // Update existing model
      updated = [...existing];
      updated[existingIndex] = { ...model, updatedAt: Date.now() };
    } else {
      // Add new model
      updated = [...existing, { ...model, updatedAt: Date.now() }];

      // Keep max 10 models - remove oldest if over limit
      if (updated.length > 10) {
        updated.sort((a, b) => b.updatedAt - a.updatedAt);
        updated = updated.slice(0, 10);
      }
    }

    await saveRunnerProfile({ ...profile, customPrModels: updated });
  } catch (error) {
    console.warn("PROFILE_STORE_ADD_CUSTOM_PR_MODEL_ERROR", error);
  }
}

export async function deleteCustomPrModel(modelId: string): Promise<void> {
  try {
    const profile = await getRunnerProfile();
    if (!profile) {
      console.warn("Cannot delete custom PR model: no profile found");
      return;
    }

    const existing = profile.customPrModels ?? [];
    const updated = existing.filter((m) => m.id !== modelId);

    await saveRunnerProfile({ ...profile, customPrModels: updated });
  } catch (error) {
    console.warn("PROFILE_STORE_DELETE_CUSTOM_PR_MODEL_ERROR", error);
  }
}

export async function updateCustomPrModelUsage(
  modelLabel: string,
): Promise<void> {
  try {
    const profile = await getRunnerProfile();
    if (!profile) {
      return;
    }

    const existing = profile.customPrModels ?? [];
    const modelIndex = existing.findIndex((m) => m.label === modelLabel);

    if (modelIndex >= 0) {
      const updated = [...existing];
      updated[modelIndex] = { ...updated[modelIndex], updatedAt: Date.now() };
      await saveRunnerProfile({ ...profile, customPrModels: updated });
    }
  } catch (error) {
    console.warn("PROFILE_STORE_UPDATE_CUSTOM_PR_MODEL_USAGE_ERROR", error);
  }
}

// Helper to get the latest test for a specific type
export async function getLatestTestByType(
  type: TestType,
): Promise<PaceTestRecord | null> {
  const tests = await getPaceTests();
  const filtered = tests.filter((t) => t.type === type);
  if (filtered.length === 0) return null;
  // Already sorted by date descending, so first is latest
  return filtered[0];
}

// Helper to get all tests grouped by type (latest for each)
export async function getTestsByType(): Promise<
  Record<TestType, PaceTestRecord | null>
> {
  const tests = await getPaceTests();
  const result: Record<TestType, PaceTestRecord | null> = {
    "1min": null,
    "200m": null,
    "1k": null,
    "5k": null,
    "10k": null,
  };

  for (const test of tests) {
    if (!result[test.type] || test.dateISO > result[test.type]!.dateISO) {
      result[test.type] = test;
    }
  }

  return result;
}

// ---- New Dynamic Test Records API ----

/**
 * Compare two records to determine which represents a better performance
 * For time_over_distance (fixed distance): shorter duration is better
 * For distance_over_time (fixed time): longer distance is better
 * Falls back to createdAt if modes don't match or metrics are missing
 */
function isRecordBetter(record1: TestRecord, record2: TestRecord): boolean {
  // If modes match, compare based on performance
  if (record1.mode === record2.mode) {
    if (record1.mode === "time_over_distance") {
      // Fixed distance: shorter time is better
      if (record1.durationSeconds != null && record2.durationSeconds != null) {
        return record1.durationSeconds < record2.durationSeconds;
      }
    } else if (record1.mode === "distance_over_time") {
      // Fixed time: longer distance is better
      if (record1.distanceMeters != null && record2.distanceMeters != null) {
        return record1.distanceMeters > record2.distanceMeters;
      }
    }
  }

  // Fallback: if modes don't match or metrics missing, use createdAt (newer is "better" for display)
  const ts1 = record1.createdAt ?? 0;
  const ts2 = record2.createdAt ?? 0;
  return ts1 >= ts2;
}

/**
 * Get the best record per label (by performance, not timestamp)
 * Groups records by label string and keeps only the one with the best performance
 * For time_over_distance: keeps the record with shortest duration
 * For distance_over_time: keeps the record with longest distance
 */
function getBestRecordsByLabel(records: TestRecord[]): TestRecord[] {
  const byLabel = new Map<string, TestRecord>();

  for (const r of records) {
    const key = r.label?.trim() ?? "";
    if (!key) continue;

    const prev = byLabel.get(key);

    if (!prev) {
      byLabel.set(key, r);
    } else {
      // Keep the one with better performance
      if (isRecordBetter(r, prev)) {
        byLabel.set(key, r);
      }
    }
  }

  return Array.from(byLabel.values());
}

/**
 * Get all test records WITHOUT deduplication (for history view)
 * Returns all records sorted by createdAt descending
 */
export async function getAllTestRecords(): Promise<TestRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(TEST_RECORDS_KEY);
    const parsed = safeParseJSON<TestRecord[]>(raw);
    if (!parsed || !Array.isArray(parsed)) return [];

    // Validate each record
    const validated: TestRecord[] = [];
    for (const item of parsed) {
      const validatedRecord = validateTestRecord(item);
      if (validatedRecord) {
        validated.push(validatedRecord);
      } else {
        console.warn("Invalid test record found, skipping:", item);
      }
    }

    // Normalize labels first based on mode
    const normalized = validated.map((record) => {
      let canonicalLabel = record.label;
      if (
        record.mode === "time_over_distance" &&
        record.distanceMeters != null
      ) {
        canonicalLabel = formatDistanceLabel(record.distanceMeters);
      } else if (
        record.mode === "distance_over_time" &&
        record.durationSeconds != null
      ) {
        canonicalLabel = formatDurationLabel(record.durationSeconds);
      } else if (record.durationSeconds != null) {
        // Fallback: if mode not set, use duration if available
        canonicalLabel = formatDurationLabel(record.durationSeconds);
      } else if (record.distanceMeters != null) {
        // Fallback: if mode not set, use distance if available
        canonicalLabel = formatDistanceLabel(record.distanceMeters);
      }

      return {
        ...record,
        label: canonicalLabel,
      };
    });

    // Sort by createdAt descending (most recent first)
    return normalized.sort((a, b) => {
      const aTs = a.createdAt ?? 0;
      const bTs = b.createdAt ?? 0;
      return bTs - aTs;
    });
  } catch (error) {
    console.warn("PROFILE_STORE_GET_ALL_TEST_RECORDS_ERROR", error);
    return [];
  }
}

export async function getTestRecords(): Promise<TestRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(TEST_RECORDS_KEY);
    const parsed = safeParseJSON<TestRecord[]>(raw);
    if (!parsed || !Array.isArray(parsed)) return [];

    // Validate each record
    const validated: TestRecord[] = [];
    for (const item of parsed) {
      const validatedRecord = validateTestRecord(item);
      if (validatedRecord) {
        validated.push(validatedRecord);
      } else {
        console.warn("Invalid test record found, skipping:", item);
      }
    }

    // Normalize labels first based on mode
    const normalized = validated.map((record) => {
      let canonicalLabel = record.label;
      if (
        record.mode === "time_over_distance" &&
        record.distanceMeters != null
      ) {
        canonicalLabel = formatDistanceLabel(record.distanceMeters);
      } else if (
        record.mode === "distance_over_time" &&
        record.durationSeconds != null
      ) {
        canonicalLabel = formatDurationLabel(record.durationSeconds);
      } else if (record.durationSeconds != null) {
        // Fallback: if mode not set, use duration if available
        canonicalLabel = formatDurationLabel(record.durationSeconds);
      } else if (record.distanceMeters != null) {
        // Fallback: if mode not set, use distance if available
        canonicalLabel = formatDistanceLabel(record.distanceMeters);
      }

      return {
        ...record,
        label: canonicalLabel,
      };
    });

    // Dedupe by label, keeping best performance record per label
    const deduped = getBestRecordsByLabel(normalized);

    // Sort: Distance PRs first (shortest to longest), then Duration PRs (shortest to longest)
    return deduped.sort((a, b) => {
      // Distance PRs first
      if (a.distanceMeters != null && b.distanceMeters == null) return -1;
      if (a.distanceMeters == null && b.distanceMeters != null) return 1;

      // Both distance PRs: sort by distanceMeters ascending (shortest to longest)
      if (a.distanceMeters != null && b.distanceMeters != null) {
        return a.distanceMeters - b.distanceMeters;
      }

      // Both duration PRs: sort by durationSeconds ascending (shortest to longest)
      if (a.durationSeconds != null && b.durationSeconds != null) {
        return a.durationSeconds - b.durationSeconds;
      }

      // Fallback: label comparison
      return a.label.localeCompare(b.label);
    });
  } catch (error) {
    console.warn("PROFILE_STORE_GET_TEST_RECORDS_ERROR", error);
    return [];
  }
}

export async function saveTestRecord(record: TestRecord): Promise<void> {
  try {
    // Validate before saving
    const validated = validateTestRecord(record);
    if (!validated) {
      throw new Error("Invalid test record data");
    }

    // Normalize label to canonical format based on mode
    // time_over_distance = distance PR (use distance label)
    // distance_over_time = duration PR (use duration label)
    let canonicalLabel = record.label;
    if (record.mode === "time_over_distance" && record.distanceMeters != null) {
      canonicalLabel = formatDistanceLabel(record.distanceMeters);
    } else if (
      record.mode === "distance_over_time" &&
      record.durationSeconds != null
    ) {
      canonicalLabel = formatDurationLabel(record.durationSeconds);
    } else if (record.durationSeconds != null) {
      // Fallback: if mode not set, use duration if available
      canonicalLabel = formatDurationLabel(record.durationSeconds);
    } else if (record.distanceMeters != null) {
      // Fallback: if mode not set, use distance if available
      canonicalLabel = formatDistanceLabel(record.distanceMeters);
    }

    const normalizedRecord: TestRecord = {
      ...validated,
      label: canonicalLabel,
      createdAt: validated.createdAt ?? Date.now(), // Ensure createdAt is set
    };

    // Load all records from storage (raw, not deduped)
    const raw = await AsyncStorage.getItem(TEST_RECORDS_KEY);
    const parsed = safeParseJSON<TestRecord[]>(raw);
    const allRecords = parsed ?? [];

    // Find existing records with the same label
    const existingRecordsWithSameLabel: TestRecord[] = [];
    const otherRecords: TestRecord[] = [];

    for (const t of allRecords) {
      // Normalize existing record's label for comparison based on mode
      let existingLabel = t.label;
      if (t.mode === "time_over_distance" && t.distanceMeters != null) {
        existingLabel = formatDistanceLabel(t.distanceMeters);
      } else if (t.mode === "distance_over_time" && t.durationSeconds != null) {
        existingLabel = formatDurationLabel(t.durationSeconds);
      } else if (t.durationSeconds != null) {
        // Fallback: if mode not set, use duration if available
        existingLabel = formatDurationLabel(t.durationSeconds);
      } else if (t.distanceMeters != null) {
        // Fallback: if mode not set, use distance if available
        existingLabel = formatDistanceLabel(t.distanceMeters);
      }

      if (existingLabel === canonicalLabel) {
        existingRecordsWithSameLabel.push(t);
      } else {
        otherRecords.push(t);
      }
    }

    // Always save the new record (for history)
    // The getBestRecordsByLabel function will ensure only the best performance is shown as PR
    const next = [...allRecords, normalizedRecord];
    await AsyncStorage.setItem(TEST_RECORDS_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("PROFILE_STORE_SAVE_TEST_RECORD_ERROR", error);
    throw error;
  }
}

export async function deleteTestRecord(id: string): Promise<void> {
  try {
    // Load all records from storage (raw, not deduped)
    const raw = await AsyncStorage.getItem(TEST_RECORDS_KEY);
    const parsed = safeParseJSON<TestRecord[]>(raw);
    if (!parsed) return;

    // Remove the record with this id
    const next = parsed.filter((t) => t.id !== id);
    await AsyncStorage.setItem(TEST_RECORDS_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("PROFILE_STORE_DELETE_TEST_RECORD_ERROR", error);
    throw error;
  }
}

/**
 * Replace all test records with a new array, deduplicating by label and keeping latest record
 * This is used by the draft editor to commit all changes at once
 */
export async function replaceAllTestRecords(
  newTests: TestRecord[],
): Promise<void> {
  try {
    // Validate all records first
    const validated: TestRecord[] = [];
    for (const test of newTests) {
      const validatedTest = validateTestRecord(test);
      if (validatedTest) {
        validated.push(validatedTest);
      } else {
        console.warn("Invalid test record found, skipping:", test);
      }
    }

    // Normalize labels to canonical format based on mode
    const normalized = validated.map((test) => {
      let canonicalLabel = test.label;
      if (test.mode === "time_over_distance" && test.distanceMeters != null) {
        canonicalLabel = formatDistanceLabel(test.distanceMeters);
      } else if (
        test.mode === "distance_over_time" &&
        test.durationSeconds != null
      ) {
        canonicalLabel = formatDurationLabel(test.durationSeconds);
      } else if (test.durationSeconds != null) {
        // Fallback: if mode not set, use duration if available
        canonicalLabel = formatDurationLabel(test.durationSeconds);
      } else if (test.distanceMeters != null) {
        // Fallback: if mode not set, use distance if available
        canonicalLabel = formatDistanceLabel(test.distanceMeters);
      }
      return {
        ...test,
        label: canonicalLabel,
        createdAt: test.createdAt ?? Date.now(), // Ensure createdAt is set
      };
    });

    // Deduplicate by label, keeping best performance record per label
    const deduped = getBestRecordsByLabel(normalized);

    // Sort: Distance PRs first (shortest to longest), then Duration PRs (shortest to longest)
    const sorted = deduped.sort((a, b) => {
      // Distance PRs first
      if (a.distanceMeters != null && b.distanceMeters == null) return -1;
      if (a.distanceMeters == null && b.distanceMeters != null) return 1;

      // Both distance PRs: sort by distanceMeters ascending (shortest to longest)
      if (a.distanceMeters != null && b.distanceMeters != null) {
        return a.distanceMeters - b.distanceMeters;
      }

      // Both duration PRs: sort by durationSeconds ascending (shortest to longest)
      if (a.durationSeconds != null && b.durationSeconds != null) {
        return a.durationSeconds - b.durationSeconds;
      }

      // Fallback: label comparison
      return a.label.localeCompare(b.label);
    });

    await AsyncStorage.setItem(TEST_RECORDS_KEY, JSON.stringify(sorted));
  } catch (error) {
    console.warn("PROFILE_STORE_REPLACE_ALL_TEST_RECORDS_ERROR", error);
    throw error;
  }
}
