/**
 * Batch A — onboarding UX: inclusive roles, pace sync, truthful welcome helpers.
 */

import { nearestPaceReference } from "../paceNearestRef";

describe("nearestPaceReference — single value for slider + cards", () => {
  it("highlights run at 5'00", () => {
    expect(nearestPaceReference(5).id).toBe("run");
  });

  it("highlights run for default 5.25 (not a desynced 5'00 sticky id)", () => {
    expect(nearestPaceReference(5.25).id).toBe("run");
  });

  it("highlights talk near 6", () => {
    expect(nearestPaceReference(6.1).id).toBe("talk");
  });

  it("highlights walk near 7+", () => {
    expect(nearestPaceReference(7.2).id).toBe("walk");
  });
});

describe("truthful welcome copy guards", () => {
  it("role labels match inclusive product copy", () => {
    const labels = {
      solo: "Découvrir à mon rythme",
      club: "Rejoindre un club",
      coach: "Créer un club",
    };
    expect(Object.values(labels)).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Je cours|coureurs|Comment tu cours/i),
      ]),
    );
  });
});
