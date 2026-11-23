import {
  buildPaceFourchetteLabel,
  normalizePaceToken,
  splitPaceFourchette,
} from "../paceFourchette";

describe("paceFourchette", () => {
  it("normalizes pace tokens", () => {
    expect(normalizePaceToken("6:00")).toBe("6:00");
    expect(normalizePaceToken("6'05")).toBe("6:05");
    expect(normalizePaceToken("libre")).toBe("Libre");
    expect(normalizePaceToken("99:00")).toBeNull();
  });

  it("splits stored fourchettes", () => {
    expect(splitPaceFourchette("6:00–7:00/km")).toEqual({
      min: "6:00",
      max: "7:00",
      libre: false,
    });
    expect(splitPaceFourchette("Allure libre")).toEqual({
      min: "",
      max: "",
      libre: true,
    });
  });

  it("builds labels for cards", () => {
    expect(buildPaceFourchetteLabel("6:00", "7:00", false)).toEqual({
      label: "6:00–7:00/km",
      error: null,
    });
    expect(buildPaceFourchetteLabel("", "", true)).toEqual({
      label: "Allure libre",
      error: null,
    });
    expect(buildPaceFourchetteLabel("7:00", "6:00", false).error).toMatch(
      /fourchette/i,
    );
  });
});
