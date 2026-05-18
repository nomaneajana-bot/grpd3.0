/** Maps onboarding route segment → progress index (0-based). */
export const ONBOARDING_STEP_BY_SEGMENT: Record<string, number> = {
  index: 0,
  phone: 1,
  verify: 2,
  profile: 3,
  role: 4,
  pace: 5,
  goal: 6,
  club: 7,
  "create-club": 7,
  permissions: 8,
  welcome: 9,
};

export const ONBOARDING_TOTAL_STEPS = 10;

export function onboardingStepFromPathname(pathname: string): number {
  const segment = pathname.split("/").filter(Boolean).pop() ?? "index";
  return ONBOARDING_STEP_BY_SEGMENT[segment] ?? 0;
}
