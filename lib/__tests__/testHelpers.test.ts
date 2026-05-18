import {
  calculatePaceSecondsPerKmSafe,
  formatPaceInputDisplay,
  parsePaceInput,
} from "../testHelpers";

describe("calculatePaceSecondsPerKmSafe", () => {
  it("computes pace for 10 km in 50 minutes", () => {
    expect(
      calculatePaceSecondsPerKmSafe({
        distanceMeters: 10_000,
        durationSeconds: 50 * 60,
      }),
    ).toBe(300);
  });

  it("computes pace for 5 km in 25 minutes", () => {
    expect(
      calculatePaceSecondsPerKmSafe({
        distanceMeters: 5_000,
        durationSeconds: 25 * 60,
      }),
    ).toBe(300);
  });

  it("computes pace for 1 km in 30 seconds (not minutes)", () => {
    expect(
      calculatePaceSecondsPerKmSafe({
        distanceMeters: 1_000,
        durationSeconds: 30,
      }),
    ).toBe(30);
  });
});

describe("formatPaceInputDisplay", () => {
  it("formats 5:00/km as 5:00", () => {
    expect(formatPaceInputDisplay(300)).toBe("5:00");
  });

  it("formats sub-minute pace", () => {
    expect(formatPaceInputDisplay(30)).toBe("0:30");
  });
});

describe("parsePaceInput", () => {
  it("parses MM:SS", () => {
    expect(parsePaceInput("5:30")).toBe(330);
  });
});
