/**
 * GRPD rule-based coach — deterministic, offline, no external AI.
 */

import { coachMessages } from "./coachMessages";
import { classifySessionIntensity, normType } from "./buildCoachContext";
import type { CoachContext, CoachReply, CoachTrigger } from "./coachTypes";

const MAX_SENTENCES = 3;

export function clipMessage(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const chunks = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (chunks.length <= MAX_SENTENCES) return chunks.join(" ");
  return chunks.slice(0, MAX_SENTENCES).join(" ");
}

function reply(
  message: string,
  trigger: CoachTrigger,
  extra?: Partial<CoachReply>,
): CoachReply {
  return {
    ...extra,
    message: clipMessage(message),
    trigger,
  };
}

function groupAdvice(group: string | undefined): string | null {
  const g = normType(group);
  if (!g) return null;
  if (g.includes("d") || g.includes("lent")) return coachMessages.groupSlow;
  if (g.includes("a") || g.includes("b")) return coachMessages.groupFast;
  return null;
}

function sessionTypeAdvice(t: string): { message: string; trigger: CoachTrigger } {
  const u = normType(t);
  const intensity = classifySessionIntensity(t);
  if (u.includes("fartlek"))
    return { message: coachMessages.fartlek, trigger: "fartlek" };
  if (u.includes("tempo") || u.includes("seuil") || u.includes("threshold"))
    return { message: coachMessages.tempo, trigger: "tempo" };
  if (intensity === "easy")
    return { message: coachMessages.easyRun, trigger: "easy_run" };
  if (u.includes("marche") || u.includes("walk"))
    return { message: coachMessages.walk, trigger: "easy_run" };
  if (u.includes("interval") || u.includes("serie") || u.includes("série"))
    return { message: coachMessages.interval, trigger: "session_type_default" };
  return { message: coachMessages.defaultSession, trigger: "session_type_default" };
}

/** Priority-ordered rules — first strong signal wins for primary line. */
export function applyPriorityRules(context: CoachContext): CoachReply | null {
  const days = context.daysSinceLastSession;
  if (days != null && days >= 5) {
    return reply(coachMessages.comeback, "skipped_5d", {
      actionLabel: "Footing facile 25 min",
    });
  }

  if ((context.hardSessionsLast4Days ?? 0) >= 2) {
    return reply(coachMessages.overload, "overload_hard", {
      actionLabel: "Footing conversationnel",
    });
  }

  const streak = context.streakCount;
  if (streak === 0) {
    return reply(coachMessages.streakZero, "streak_zero", {
      actionLabel: "Rejoindre une séance",
    });
  }
  if (streak != null && streak >= 10) {
    return reply(coachMessages.streakReliable(streak), "streak_reliable");
  }
  if (streak != null && streak >= 3 && streak <= 9) {
    return reply(coachMessages.streakBuilding(streak), "streak_building");
  }

  if (context.lastSessionRating === "trop_dur") {
    return reply(coachMessages.feedbackTropDur, "feedback_trop_dur", {
      actionLabel: "Groupe plus lent",
    });
  }
  if (context.lastSessionRating === "trop_facile") {
    return reply(coachMessages.feedbackTropFacile, "feedback_trop_facile");
  }

  return null;
}

export function getPostSessionFeedback(
  rating: string,
  context: CoachContext,
): CoachReply {
  void context;
  const r = normType(rating);
  if (r.includes("facile") || r.includes("trop_facile")) {
    return reply(coachMessages.feedbackTropFacile, "feedback_trop_facile");
  }
  if (r.includes("juste") || r.includes("bien")) {
    return reply(coachMessages.feedbackJusteBien, "feedback_juste_bien");
  }
  return reply(coachMessages.feedbackTropDur, "feedback_trop_dur");
}

export function getPreSessionAdvice(context: CoachContext): CoachReply {
  const priority = applyPriorityRules(context);
  const typeLine = sessionTypeAdvice(context.sessionType ?? "");
  const g = groupAdvice(context.userGroup);

  if (priority) {
    const parts = [priority.message];
    if (
      priority.trigger !== "fartlek" &&
      typeLine.trigger === "fartlek" &&
      normType(context.sessionType).includes("fartlek")
    ) {
      parts.push(typeLine.message);
    } else if (
      priority.trigger !== "overload_hard" &&
      priority.trigger !== "skipped_5d"
    ) {
      parts.push(typeLine.message);
    }
    if (g) parts.push(g);
    return {
      ...priority,
      message: clipMessage(parts.join(" ")),
    };
  }

  const parts: string[] = [typeLine.message];
  if (g) parts.push(g);
  return reply(parts.join(" "), typeLine.trigger);
}

export function getWeeklySummary(context: CoachContext): CoachReply {
  const priority = applyPriorityRules(context);
  if (priority?.trigger === "skipped_5d" || priority?.trigger === "overload_hard") {
    return priority;
  }

  const n = context.weekSessions?.length ?? 0;
  if (n === 0) return reply(coachMessages.weeklyEmpty, "weekly_empty");
  if (n === 1) return reply(coachMessages.weeklyOne, "weekly_light");
  if (n <= 3)
    return reply(coachMessages.weeklyBalanced(n), "weekly_balanced");
  return reply(coachMessages.weeklyHeavy, "weekly_heavy");
}

/** @deprecated Use getWeeklySummary */
export const getWeeklyPlanAdvice = getWeeklySummary;

export function getDailyCoachTake(context: CoachContext): CoachReply {
  const priority = applyPriorityRules(context);
  if (priority && ["skipped_5d", "overload_hard", "streak_zero"].includes(priority.trigger ?? "")) {
    return { ...priority, title: "Aujourd'hui" };
  }

  const lines: string[] = [];
  const typeLine = sessionTypeAdvice(
    context.sessionType ?? context.lastSessionType ?? "",
  );
  lines.push(typeLine.message);
  const g = groupAdvice(context.userGroup);
  if (g) lines.push(g);
  if (priority) lines.unshift(priority.message);
  if (context.lastSessionRating && !priority) {
    lines.push(getPostSessionFeedback(context.lastSessionRating, context).message);
  }
  if (lines.length === 0) {
    lines.push(coachMessages.dailyFallback);
  }
  return {
    title: "Aujourd'hui",
    message: clipMessage(lines.join(" ")),
    trigger: priority?.trigger ?? typeLine.trigger,
  };
}

export function getWorkoutBuilderAdvice(
  question: string,
  context: CoachContext,
): CoachReply {
  return getWorkoutBuilderAnswer(question, context);
}

export function getWorkoutBuilderAnswer(
  question: string,
  context: CoachContext,
): CoachReply {
  const q = normType(question);
  const rt = normType(context.sessionType);

  const isFartlek = rt.includes("fartlek");
  const isTempo = rt.includes("tempo") || rt.includes("seuil");
  const isIntervals =
    rt.includes("interval") ||
    rt.includes("400") ||
    rt.includes("800") ||
    rt.includes("1000") ||
    rt.includes("1600");

  if (isFartlek) {
    if (q.includes("rep") || q.includes("repet"))
      return reply(coachMessages.builderFartlekReps, "builder_answer");
    if (q.includes("allure") || q.includes("pace"))
      return reply(coachMessages.builderFartlekPace, "builder_answer");
    if (q.includes("duree") || q.includes("durée") || q.includes("ideal") || q.includes("idéale"))
      return reply(coachMessages.builderFartlekDuration, "builder_answer");
  }
  if (isTempo) {
    if (q.includes("duree") || q.includes("durée"))
      return reply(coachMessages.builderTempoDuration, "builder_answer");
    if (q.includes("echauff") || q.includes("échauff"))
      return reply(coachMessages.builderTempoWarmup, "builder_answer");
    if (q.includes("recup") || q.includes("récup"))
      return reply(coachMessages.builderTempoRecovery, "builder_answer");
  }
  if (isIntervals) {
    if (q.includes("distance"))
      return reply(coachMessages.builderIntervalDistance, "builder_answer");
    if (q.includes("recup") || q.includes("récup") || q.includes("temps"))
      return reply(coachMessages.builderIntervalRecovery, "builder_answer");
    if (q.includes("serie") || q.includes("série") || q.includes("nombre"))
      return reply(coachMessages.builderIntervalSets, "builder_answer");
  }

  const typeLine = sessionTypeAdvice(context.sessionType ?? "footing");
  return reply(typeLine.message, "builder_answer");
}

export function getCoachReply(question: string, context: CoachContext): CoachReply {
  const q = normType(question);
  if (context.screen === "workout_builder")
    return getWorkoutBuilderAdvice(question, context);
  if (q.includes("semaine") || q.includes("plan")) return getWeeklySummary(context);
  if (
    q.includes("avant") ||
    q.includes("demain") ||
    q.includes("seance") ||
    q.includes("séance")
  ) {
    return getPreSessionAdvice(context);
  }
  return reply(coachMessages.generic, "generic");
}

// Re-export for backward compat
export { computeAttendedStreakCount, streakMotivationMessage } from "./buildCoachContext";
