/** Maps onboarding route segment → progress index (0-based). */
export const ONBOARDING_STEP_BY_SEGMENT: Record<string, number> = {
  index: 0,
  phone: 1,
  verify: 2,
  profile: 3,
  role: 4,
  // pace removed — redirect only; keep index aligned with goal for deep links
  pace: 5,
  goal: 5,
  club: 6,
  "create-club": 6,
  permissions: 7,
  welcome: 8,
};

export const ONBOARDING_TOTAL_STEPS = 9;

export function onboardingStepFromPathname(pathname: string): number {
  const segment = pathname.split("/").filter(Boolean).pop() ?? "index";
  return ONBOARDING_STEP_BY_SEGMENT[segment] ?? 0;
}
