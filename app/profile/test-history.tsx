import * as Haptics from "expo-haptics";
import { router, Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getAllTestRecords, type TestRecord } from "../../lib/profileStore";
import {
    formatDateForList,
    formatDistance,
    formatPace,
    formatTime,
} from "../../lib/testHelpers";

type SortOption = "date" | "pace" | "distance" | "duration";

export default function TestHistoryScreen() {
  const [allTests, setAllTests] = useState<TestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(
    new Set(),
  );

  const loadTests = async () => {
    setIsLoading(true);
    try {
      const tests = await getAllTestRecords();
      setAllTests(tests);
    } catch (error) {
      console.warn("Failed to load test history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTests();
    }, []),
  );

  // Extract unique filter options from test labels
  const filterOptions = useMemo(() => {
    const labels = new Set<string>();

    allTests.forEach((test) => {
      labels.add(test.label);
    });

    // Sort labels alphabetically
    return Array.from(labels).sort((a, b) => a.localeCompare(b));
  }, [allTests]);

  // Sort and filter tests
  const sortedAndFilteredTests = useMemo(() => {
    let filtered = [...allTests];

    // Apply filters (if "Tous" is not selected or if a specific label is selected)
    if (selectedFilters.size > 0 && !selectedFilters.has("Tous")) {
      filtered = filtered.filter((test) => {
        // Check if matches specific label filter
        return selectedFilters.has(test.label);
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date": {
          // Date descending (most recent first)
          const aTs =
            a.createdAt ?? (a.testDate ? new Date(a.testDate).getTime() : 0);
          const bTs =
            b.createdAt ?? (b.testDate ? new Date(b.testDate).getTime() : 0);
          return bTs - aTs;
        }
        case "pace": {
          // Pace ascending (fastest first)
          const aPace = a.paceSecondsPerKm ?? Infinity;
          const bPace = b.paceSecondsPerKm ?? Infinity;
          return aPace - bPace;
        }
        case "distance": {
          // Distance ascending
          const aDist = a.distanceMeters ?? Infinity;
          const bDist = b.distanceMeters ?? Infinity;
          return aDist - bDist;
        }
        case "duration": {
          // Duration ascending
          const aDur = a.durationSeconds ?? Infinity;
          const bDur = b.durationSeconds ?? Infinity;
          return aDur - bDur;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [allTests, sortBy, selectedFilters]);

  const toggleFilter = (filter: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  };

  const clearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFilters(new Set());
  };

  const renderTestRow = ({
    item: test,
    index,
  }: {
    item: TestRecord;
    index: number;
  }) => {
    const paceDisplay = formatPace(test.paceSecondsPerKm);
    const distanceDisplay = test.distanceMeters
      ? formatDistance(test.distanceMeters)
      : null;
    const durationDisplay = test.durationSeconds
      ? formatTime(test.durationSeconds)
      : null;
    const dateLabel = test.testDate
      ? formatDateForList(test.testDate)
      : "À définir";

    // Determine if this is a distance-fixed or duration-fixed PR
    const isDistanceFixed =
      test.mode === "time_over_distance" ||
      (test.distanceMeters !== null &&
        test.durationSeconds !== null &&
        test.kind === "distance");
    const isDurationFixed =
      test.mode === "distance_over_time" ||
      (test.distanceMeters !== null &&
        test.durationSeconds !== null &&
        test.kind === "duration");

    return (
      <View>
        {index > 0 && <View style={styles.rowDivider} />}
        <View style={styles.testRow}>
          <View style={styles.testRowLeft}>
            <Text style={styles.testLabelPrimary}>{test.label}</Text>
            {isDistanceFixed && durationDisplay && (
              <Text style={styles.testLabelSecondary}>
                Temps : {durationDisplay} · Allure : {paceDisplay}
              </Text>
            )}
            {isDurationFixed && distanceDisplay && (
              <Text style={styles.testLabelSecondary}>
                Distance : {distanceDisplay} · Allure : {paceDisplay}
              </Text>
            )}
          </View>
          <View style={styles.testRowRight}>
            <Text style={styles.testDate}>{dateLabel}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backRow}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Historique de tes PR</Text>
        <Text style={styles.screenSubtitle}>
          Tous tes PR enregistrés. Trie-les comme tu veux.
        </Text>
      </View>

      {/* Sort Bar */}
      <View style={styles.sortBar}>
        <Text style={styles.sortLabel}>Trier par:</Text>
        <View style={styles.sortPills}>
          <Pressable
            style={({ pressed }) => [
              styles.sortPill,
              sortBy === "date" && styles.sortPillActive,
              pressed && styles.sortPillPressed,
            ]}
            onPress={() => {
              setSortBy("date");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text
              style={[
                styles.sortPillText,
                sortBy === "date" && styles.sortPillTextActive,
              ]}
            >
              Date
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.sortPill,
              sortBy === "pace" && styles.sortPillActive,
              pressed && styles.sortPillPressed,
            ]}
            onPress={() => {
              setSortBy("pace");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text
              style={[
                styles.sortPillText,
                sortBy === "pace" && styles.sortPillTextActive,
              ]}
            >
              Allure
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.sortPill,
              sortBy === "distance" && styles.sortPillActive,
              pressed && styles.sortPillPressed,
            ]}
            onPress={() => {
              setSortBy("distance");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text
              style={[
                styles.sortPillText,
                sortBy === "distance" && styles.sortPillTextActive,
              ]}
            >
              Distance
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.sortPill,
              sortBy === "duration" && styles.sortPillActive,
              pressed && styles.sortPillPressed,
            ]}
            onPress={() => {
              setSortBy("duration");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text
              style={[
                styles.sortPillText,
                sortBy === "duration" && styles.sortPillTextActive,
              ]}
            >
              Durée
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Filters */}
      {filterOptions.length > 0 && (
        <View style={styles.filtersBar}>
          <View style={styles.filtersRow}>
            <Pressable
              style={({ pressed }) => [
                styles.filterChip,
                (selectedFilters.size === 0 || selectedFilters.has("Tous")) &&
                  styles.filterChipActive,
                pressed && styles.filterChipPressed,
              ]}
              onPress={() => {
                setSelectedFilters(new Set(["Tous"]));
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  (selectedFilters.size === 0 || selectedFilters.has("Tous")) &&
                    styles.filterChipTextActive,
                ]}
              >
                Tous
              </Text>
            </Pressable>
            {filterOptions.map((label) => {
              const isSelected = selectedFilters.has(label);

              return (
                <Pressable
                  key={label}
                  style={({ pressed }) => [
                    styles.filterChip,
                    isSelected && styles.filterChipActive,
                    pressed && styles.filterChipPressed,
                  ]}
                  onPress={() => toggleFilter(label)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Test List */}
      {isLoading ? (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : sortedAndFilteredTests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {selectedFilters.size > 0 && !selectedFilters.has("Tous")
              ? "Aucun PR ne correspond aux filtres sélectionnés"
              : "Aucun PR enregistré"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedAndFilteredTests}
          renderItem={renderTestRow}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          style={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#0B0B0B",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  backIcon: {
    color: "#2081FF",
    fontSize: 18,
    marginRight: 4,
  },
  backLabel: {
    color: "#2081FF",
    fontSize: 16,
    fontWeight: "500",
  },
  screenTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
  },
  screenSubtitle: {
    color: "#8A8A8A",
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 8,
  },
  sortBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#0B0B0B",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  sortLabel: {
    color: "#BFBFBF",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  sortPills: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  sortPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#131313",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  sortPillActive: {
    backgroundColor: "#2081FF",
    borderColor: "#2081FF",
  },
  sortPillPressed: {
    opacity: 0.7,
  },
  sortPillText: {
    color: "#BFBFBF",
    fontSize: 13,
    fontWeight: "600",
  },
  sortPillTextActive: {
    color: "#FFFFFF",
  },
  filtersBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#0B0B0B",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#131313",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  filterChipCategory: {
    backgroundColor: "#1A1A1A",
  },
  filterChipActive: {
    backgroundColor: "rgba(32, 129, 255, 0.15)",
    borderColor: "#2081FF",
  },
  filterChipPressed: {
    opacity: 0.7,
  },
  filterChipText: {
    color: "#BFBFBF",
    fontSize: 12,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#2081FF",
    fontWeight: "600",
  },
  clearFiltersButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  clearFiltersText: {
    color: "#2081FF",
    fontSize: 12,
    fontWeight: "600",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  testRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#131313",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    marginBottom: 12,
  },
  testRowPressed: {
    opacity: 0.7,
  },
  rowDivider: {
    height: 12,
  },
  testRowLeft: {
    flex: 1,
    marginRight: 16,
  },
  testLabelPrimary: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  testLabelSecondary: {
    color: "#BFBFBF",
    fontSize: 13,
    fontWeight: "400",
  },
  testMetricsRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  testMetric: {
    color: "#BFBFBF",
    fontSize: 13,
    fontWeight: "400",
  },
  testRowRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  testDate: {
    color: "#8A8A8A",
    fontSize: 12,
    fontWeight: "400",
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: "#BFBFBF",
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    color: "#8A8A8A",
    fontSize: 14,
    textAlign: "center",
  },
});
