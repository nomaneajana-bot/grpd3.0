import type { CoachContext } from "./coachTypes";

/** 0–100 — higher = more consistent recent showing-up. */
export function getConsistencyScore(context: CoachContext): number {
  const streak = context.streakCount ?? 0;
  const week = context.weekSessions?.length ?? 0;
  const streakPart = Math.min(streak * 8, 56);
  const weekPart = Math.min(week * 12, 36);
  return Math.min(100, streakPart + weekPart);
}

/** 0–100 — higher = more fatigue signals. */
export function getFatigueScore(context: CoachContext): number {
  let score = 0;
  if (context.lastSessionRating === "trop_dur") score += 40;
  const hard = context.hardSessionsLast4Days ?? 0;
  if (hard >= 2) score += 35;
  if (hard === 1) score += 15;
  const load = context.intensityLoad ?? getIntensityLoad(context);
  score += Math.min(25, Math.floor(load / 4));
  return Math.min(100, score);
}

/** 0–100 — recent training density / hardness. */
export function getIntensityLoad(context: CoachContext): number {
  const hard = context.hardSessionsLast4Days ?? 0;
  const week = context.weekSessions?.length ?? 0;
  const hardPart = Math.min(hard * 22, 66);
  const weekPart = Math.min(week * 10, 34);
  return Math.min(100, hardPart + weekPart);
}

export function enrichContextWithScores(
  context: CoachContext,
): CoachContext {
  return {
    ...context,
    consistencyScore: getConsistencyScore(context),
    fatigueScore: getFatigueScore(context),
    intensityLoad: getIntensityLoad(context),
  };
}
