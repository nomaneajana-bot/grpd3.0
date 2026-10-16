import {
  formatSessionDistanceKm,
  formatSessionDistanceLabel,
  formatSessionPaceLabel,
} from "../sessionDisplay";

describe("sessionDisplay", () => {
  it("shows em dash for absent or zero distance", () => {
    expect(formatSessionDistanceKm(null)).toBe("—");
    expect(formatSessionDistanceKm(undefined)).toBe("—");
    expect(formatSessionDistanceKm(0)).toBe("—");
    expect(formatSessionDistanceLabel(0)).toBe("—");
  });

  it("formats real distances", () => {
    expect(formatSessionDistanceKm(10)).toBe("10");
    expect(formatSessionDistanceLabel(12)).toBe("12 km");
    expect(formatSessionDistanceKm(8.5)).toBe("8.5");
  });

  it("does not invent pace numbers for empty values", () => {
    expect(formatSessionPaceLabel("")).toBe("—");
    expect(formatSessionPaceLabel(null)).toBe("—");
    expect(formatSessionPaceLabel("Allure libre")).toBe("Allure libre");
    expect(formatSessionPaceLabel("5:30 /km")).toBe("5:30");
  });
});
