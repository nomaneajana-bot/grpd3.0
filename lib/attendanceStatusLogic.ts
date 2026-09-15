/**
 * Commit 6: Pure logic for assign/join attendance status.
 * Commit 7: Leave sets status to "left", groupId to null.
 * - Assign: coach suggests; never downgrade "joined". Others → "suggested".
 * - Join: runner confirms; only path to "joined". Non-joined → "joined".
 * - Leave: always status "left", groupId null.
 */

export type AttendanceStatusValue =
  | "joined"
  | "attended"
  | "suggested"
  | "left"
  | "requested"
  | "waitlisted"
  | "declined";

/** Data to apply on assign: if existing is joined, only update groupId; else set status to suggested. */
export function getAssignUpdateData(
  existingStatus: AttendanceStatusValue | null,
  groupId: string
): { groupId: string; status?: "suggested" } {
  if (existingStatus === "joined" || existingStatus === "attended") {
    return { groupId };
  }
  return { groupId, status: "suggested" };
}

/** Data to apply on join: if existing is joined, only update groupId; else set status to joined. */
export function getJoinUpdateData(
  existingStatus: AttendanceStatusValue | null,
  groupId: string
): { groupId: string; status?: "joined" } {
  if (existingStatus === "joined" || existingStatus === "attended") {
    return { groupId };
  }
  return { groupId, status: "joined" };
}

/** Data to apply on leave (Commit 7): always status left, groupId null. */
export function getLeaveUpdateData(): {
  status: "left";
  groupId: null;
} {
  return { status: "left", groupId: null };
}
