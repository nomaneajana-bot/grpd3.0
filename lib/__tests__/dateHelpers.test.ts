import {
  defaultUpcomingOutingTime,
  isSelectableOutingDate,
  isSelectableOutingDateTime,
  todayISO,
} from "../dateHelpers";

describe("dateHelpers outing boundaries", () => {
  it("rejects invalid ISO for selectable date", () => {
    expect(isSelectableOutingDate("not-a-date")).toBe(false);
    expect(isSelectableOutingDate("")).toBe(false);
  });

  it("rejects past calendar days", () => {
    expect(isSelectableOutingDate("2020-01-01")).toBe(false);
  });

  it("rejects today's date when the clock time is already past", () => {
    const today = todayISO();
    expect(isSelectableOutingDateTime(today, 0)).toBe(false);
  });

  it("accepts an explicitly future local datetime", () => {
    const fixed = new Date("2030-06-15T10:00:00");
    const dateISO = "2030-06-15";
    expect(isSelectableOutingDateTime(dateISO, 11 * 60)).toBe(true);
    const def = defaultUpcomingOutingTime(fixed);
    expect(isSelectableOutingDateTime(def.dateISO, def.timeMinutes)).toBe(true);
  });

  it("defaultUpcomingOutingTime stays ahead of now", () => {
    const now = new Date();
    const def = defaultUpcomingOutingTime(now);
    expect(isSelectableOutingDateTime(def.dateISO, def.timeMinutes)).toBe(true);
  });
});
