export type CoachScreen =
  | "home"
  | "workout_builder"
  | "session_detail"
  | "my_sessions"
  | "profile";

export type CoachSessionRating = "trop_facile" | "juste_bien" | "trop_dur";

export type CoachProviderName = "internal" | "openai" | "hybrid";

export type RunnerLevel = "beginner" | "regular" | "reliable";

export type SessionIntensity = "easy" | "moderate" | "hard";

export type CoachTrigger =
  | "skipped_5d"
  | "overload_hard"
  | "streak_zero"
  | "streak_building"
  | "streak_reliable"
  | "easy_run"
  | "fartlek"
  | "tempo"
  | "recovery"
  | "feedback_trop_dur"
  | "feedback_trop_facile"
  | "feedback_juste_bien"
  | "weekly_empty"
  | "weekly_light"
  | "weekly_balanced"
  | "weekly_heavy"
  | "session_type_default"
  | "group_hint"
  | "builder_answer"
  | "generic";

export type CoachContext = {
  screen: CoachScreen;
  sessionType?: string;
  sessionPace?: string;
  userGroup?: string;
  lastSessionRating?: CoachSessionRating;
  lastSessionType?: string;
  streakCount?: number;
  weekSessions?: string[];
  daysSinceLastSession?: number;
  hardSessionsLast4Days?: number;
  skippedSessionsLast14Days?: number;
  consistencyScore?: number;
  fatigueScore?: number;
  intensityLoad?: number;
};

export type CoachReply = {
  title?: string;
  message: string;
  actionLabel?: string;
  trigger?: CoachTrigger;
};
