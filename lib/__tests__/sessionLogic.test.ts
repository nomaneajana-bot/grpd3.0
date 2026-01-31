// Unit tests for sessionLogic.ts

import type { ReferencePaces } from "../profileStore";
import type { SessionData } from "../sessionData";
import {
    applyFiltersAndSorting,
    computeMatchScore,
    getSessionDateForSort,
    matchesPaceFilter,
    matchesSpotFilter,
    matchesTypeFilter,
    type FilterState
} from "../sessionLogic";

// Mock session data
const mockSession: SessionData = {
  id: "test-1",
  title: "FARTLEK",
  spot: "Marina",
  dateLabel: "LUNDI 10 NOVEMBRE 06:00",
  dateISO: "2025-11-10",
  timeMinutes: 360,
  typeLabel: "FARTLEK",
  volume: "3:00 effort x 6",
  targetPace: "5:20–6:00/km",
  estimatedDistanceKm: 10,
  paceGroups: [
    {
      id: "A",
      label: "Groupe A",
      paceRange: "4'00–4'30/km",
      runnersCount: 2,
      avgPaceSecondsPerKm: 255,
    },
    {
      id: "B",
      label: "Groupe B",
      paceRange: "4'30–5'00/km",
      runnersCount: 5,
      avgPaceSecondsPerKm: 285,
    },
  ],
  recommendedGroupId: "B",
};

const mockPaces: ReferencePaces = {
  easyMin: 300,
  easyMax: 330,
  tempoMin: 270,
  tempoMax: 290,
};

describe("sessionLogic", () => {
  describe("matchesTypeFilter", () => {
    it("should match when type filter matches session type", () => {
      expect(matchesTypeFilter(mockSession, "fartlek")).toBe(true);
    });

    it("should not match when type filter does not match", () => {
      expect(matchesTypeFilter(mockSession, "series" as Parameters<typeof matchesTypeFilter>[1])).toBe(false);
    });

    it("should match when filter is null/undefined", () => {
      expect(matchesTypeFilter(mockSession, null)).toBe(true);
      expect(matchesTypeFilter(mockSession, undefined)).toBe(true);
    });
  });

  describe("matchesSpotFilter", () => {
    it("should match when spot filter matches", () => {
      expect(matchesSpotFilter(mockSession, "Marina")).toBe(true);
    });

    it("should not match when spot filter does not match", () => {
      expect(matchesSpotFilter(mockSession, "Parc")).toBe(false);
    });

    it("should match when filter is null/undefined", () => {
      expect(matchesSpotFilter(mockSession, null)).toBe(true);
    });
  });

  describe("matchesPaceFilter", () => {
    it("should match when pace range overlaps with session groups", () => {
      const filter = { minSecondsPerKm: 250, maxSecondsPerKm: 270 };
      expect(matchesPaceFilter(mockSession, filter)).toBe(true);
    });

    it("should not match when pace range does not overlap", () => {
      const filter = { minSecondsPerKm: 200, maxSecondsPerKm: 220 };
      expect(matchesPaceFilter(mockSession, filter)).toBe(false);
    });

    it("should match when filter is null/undefined", () => {
      expect(matchesPaceFilter(mockSession, null)).toBe(true);
    });
  });

  describe("computeMatchScore", () => {
    it("should return a number when paces are provided", () => {
      const score = computeMatchScore(mockSession, mockPaces);
      expect(score).not.toBeNull();
      expect(typeof score).toBe("number");
    });

    it("should return null when paces are null", () => {
      expect(computeMatchScore(mockSession, null)).toBeNull();
    });

    it("should return lower score for better matches", () => {
      const closeSession: SessionData = {
        ...mockSession,
        paceGroups: [
          {
            id: "A",
            label: "Groupe A",
            paceRange: "5'00/km",
            runnersCount: 1,
            avgPaceSecondsPerKm: 300,
          },
        ],
      };
      const farSession: SessionData = {
        ...mockSession,
        paceGroups: [
          {
            id: "A",
            label: "Groupe A",
            paceRange: "3'00/km",
            runnersCount: 1,
            avgPaceSecondsPerKm: 180,
          },
        ],
      };

      const closeScore = computeMatchScore(closeSession, mockPaces);
      const farScore = computeMatchScore(farSession, mockPaces);

      expect(closeScore).not.toBeNull();
      expect(farScore).not.toBeNull();
      expect(closeScore!).toBeLessThan(farScore!);
    });
  });

  describe("getSessionDateForSort", () => {
    it("should return timestamp when dateISO is available", () => {
      const sessionWithDate: SessionData = {
        ...mockSession,
        dateISO: "2025-11-10",
        timeMinutes: 360,
      };
      const sortValue = getSessionDateForSort(sessionWithDate);
      expect(typeof sortValue).toBe("number");
      expect(sortValue).toBeGreaterThan(0);
    });

    it("should fallback to parsing dateLabel when dateISO missing", () => {
      const sessionWithoutDate: SessionData = {
        ...mockSession,
        dateISO: undefined,
        timeMinutes: undefined,
      };
      const sortValue = getSessionDateForSort(sessionWithoutDate);
      expect(typeof sortValue).toBe("number");
    });
  });

  describe("applyFiltersAndSorting", () => {
    it("should filter sessions by type", () => {
      // Create future dates for both sessions
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const futureDateISO = futureDate.toISOString().split("T")[0];

      const sessions: SessionData[] = [
        { ...mockSession, dateISO: futureDateISO, timeMinutes: 360 },
        {
          ...mockSession,
          id: "test-2",
          typeLabel: "SÉRIES",
          dateISO: futureDateISO,
          timeMinutes: 360,
        },
      ];
      const filters: FilterState = { type: "fartlek" };
      const result = applyFiltersAndSorting(sessions, filters, null);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("test-1");
    });

    it("should sort by match score when paces provided", () => {
      // Create future dates for both sessions
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const futureDateISO = futureDate.toISOString().split("T")[0];

      const sessions: SessionData[] = [
        {
          ...mockSession,
          id: "far",
          dateISO: futureDateISO,
          timeMinutes: 360,
          paceGroups: [
            {
              id: "A",
              label: "A",
              paceRange: "3'00/km",
              runnersCount: 1,
              avgPaceSecondsPerKm: 180,
            },
          ],
        },
        {
          ...mockSession,
          id: "close",
          dateISO: futureDateISO,
          timeMinutes: 360,
          paceGroups: [
            {
              id: "A",
              label: "A",
              paceRange: "5'00/km",
              runnersCount: 1,
              avgPaceSecondsPerKm: 300,
            },
          ],
        },
      ];
      const result = applyFiltersAndSorting(sessions, {}, mockPaces);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe("close"); // Better match first
      expect(result[1].id).toBe("far");
    });
  });
});
