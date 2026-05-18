/**
 * Coach facade: internal rules now; OpenAI later via server route app/api/v1/coach.
 * Do not add client-side API keys.
 */

import type { CoachContext, CoachProviderName, CoachReply } from "./coachTypes";
import { getCoachReply } from "./ruleBasedCoachEngine";

let warnedNonInternal = false;

export type { CoachProviderName as CoachProvider };

export async function getCoachResponse(
  question: string,
  context: CoachContext,
  provider: CoachProviderName = "internal",
): Promise<CoachReply> {
  if (provider !== "internal") {
    if (!warnedNonInternal && typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn(
        `[coach] Provider "${provider}" not implemented — falling back to internal rules.`,
      );
      warnedNonInternal = true;
    }
    // TODO: POST /api/v1/coach with { question, context } when server route exists.
  }
  return getCoachReply(question, context);
}
