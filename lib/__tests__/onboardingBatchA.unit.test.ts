/**
 * Batch A — onboarding UX: inclusive roles, no allure step, truthful welcome.
 */

import { ONBOARDING_STEP_BY_SEGMENT, ONBOARDING_TOTAL_STEPS } from "../onboardingSteps";

describe("onboarding steps — allure removed", () => {
  it("maps role then goal without a live pace step index gap", () => {
    expect(ONBOARDING_STEP_BY_SEGMENT.role).toBe(4);
    expect(ONBOARDING_STEP_BY_SEGMENT.goal).toBe(5);
    // Deep-link leftover /pace shares goal index (redirect only).
    expect(ONBOARDING_STEP_BY_SEGMENT.pace).toBe(ONBOARDING_STEP_BY_SEGMENT.goal);
    expect(ONBOARDING_TOTAL_STEPS).toBe(9);
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
