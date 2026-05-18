import { getCoachResponse } from "../coachProvider";
import {
  applyPriorityRules,
  computeAttendedStreakCount,
  getDailyCoachTake,
  getPostSessionFeedback,
  getPreSessionAdvice,
  getWeeklyPlanAdvice,
  getWeeklySummary,
  getWorkoutBuilderAnswer,
  streakMotivationMessage,
} from "../ruleBasedCoachEngine";
import type { CoachContext } from "../coachTypes";
import type { SessionData } from "../../sessionData";

function session(
  id: string,
  dateISO: string,
  timeMinutes = 720,
  typeLabel = "FARTLEK",
): SessionData {
  return {
    id,
    title: "Test",
    spot: "Parc",
    dateLabel: dateISO,
    dateISO,
    timeMinutes,
    typeLabel,
    volume: "1h",
    targetPace: "5:00/km",
    paceGroups: [],
    recommendedGroupId: "A",
    estimatedDistanceKm: 10,
  };
}

describe("ruleBasedCoachEngine", () => {
  it("streakMotivationMessage tiers", () => {
    expect(streakMotivationMessage(0)).toContain("première");
    expect(streakMotivationMessage(2)).toContain("série");
    expect(streakMotivationMessage(5)).toContain("5");
    expect(streakMotivationMessage(12)).toContain("12");
  });

  it("computeAttendedStreakCount counts past joined", () => {
    const past = session("1", "2020-01-01", 600);
    const future = session("2", "2035-01-01", 600);
    const joined = new Set(["1", "2"]);
    expect(computeAttendedStreakCount([past, future], joined)).toBe(1);
  });

  it("skipped 5+ days rule", () => {
    const r = applyPriorityRules({ screen: "home", daysSinceLastSession: 7 });
    expect(r?.trigger).toBe("skipped_5d");
    expect(r?.message.toLowerCase()).toMatch(/semaine|reprends|facile/i);
  });

  it("hard session overload rule", () => {
    const r = applyPriorityRules({
      screen: "session_detail",
      hardSessionsLast4Days: 2,
    });
    expect(r?.trigger).toBe("overload_hard");
    expect(r?.message.toLowerCase()).toMatch(/conversationnel|dures/i);
  });

  it("easy run rule", () => {
    const r = getPreSessionAdvice({
      screen: "session_detail",
      sessionType: "easy_run",
      streakCount: 5,
    });
    expect(r.message.toLowerCase()).toMatch(/parler|facile/i);
  });

  it("streak 0 rule", () => {
    const r = applyPriorityRules({ screen: "home", streakCount: 0 });
    expect(r?.trigger).toBe("streak_zero");
    expect(r?.message.toLowerCase()).toMatch(/première|série/i);
  });

  it("streak 10+ rule", () => {
    const r = applyPriorityRules({ screen: "home", streakCount: 12 });
    expect(r?.trigger).toBe("streak_reliable");
    expect(r?.message).toContain("12");
  });

  it("getPreSessionAdvice mentions fartlek control", () => {
    const r = getPreSessionAdvice({
      screen: "session_detail",
      sessionType: "fartlek",
      userGroup: "D",
      streakCount: 5,
    });
    expect(r.message.toLowerCase()).toMatch(/répétition|effort|sprinte/i);
  });

  it("getWeeklySummary reacts to weekSessions length", () => {
    expect(
      getWeeklySummary({ screen: "my_sessions", weekSessions: [] }).message,
    ).toMatch(/semaine/i);
    expect(
      getWeeklySummary({
        screen: "my_sessions",
        weekSessions: ["a", "b"],
      }).message,
    ).toMatch(/2/);
  });

  it("getWeeklyPlanAdvice alias matches getWeeklySummary", () => {
    const ctx: CoachContext = { screen: "my_sessions", weekSessions: ["a"] };
    expect(getWeeklyPlanAdvice(ctx).message).toBe(getWeeklySummary(ctx).message);
  });

  it("getPostSessionFeedback three ratings", () => {
    const ctx: CoachContext = { screen: "profile" };
    expect(getPostSessionFeedback("trop_facile", ctx).message).toMatch(/charge|régularité/i);
    expect(getPostSessionFeedback("juste_bien", ctx).message).toMatch(/zone|intensifier/i);
    expect(getPostSessionFeedback("trop_dur", ctx).message).toMatch(/groupe|baisse|propre/i);
  });

  it("feedback trop dur suggests easier group", () => {
    const r = getPostSessionFeedback("trop_dur", { screen: "profile" });
    expect(r.trigger).toBe("feedback_trop_dur");
    expect(r.message.toLowerCase()).toMatch(/groupe/);
  });

  it("getWorkoutBuilderAnswer fartlek reps question", () => {
    const r = getWorkoutBuilderAnswer("Combien de répét. ?", {
      screen: "workout_builder",
      sessionType: "fartlek",
    });
    expect(r.message.toLowerCase()).toMatch(/répétition|répétitions|répet|rep/);
  });

  it("getDailyCoachTake returns message", () => {
    const r = getDailyCoachTake({
      screen: "home",
      sessionType: "tempo_run",
      userGroup: "B",
      streakCount: 5,
    });
    expect(r.message.length).toBeGreaterThan(10);
  });

  it("provider fallback to internal for openai", async () => {
    const r = await getCoachResponse(
      "Conseil",
      { screen: "workout_builder", sessionType: "fartlek" },
      "openai",
    );
    expect(r.message.length).toBeGreaterThan(5);
  });
});
