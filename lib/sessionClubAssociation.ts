/**
 * Visibility (who may join) vs association (club branding / discovery).
 * Soft association: a public outing may keep clubId without gating access.
 */

export type SessionVisibilityGate = "public" | "members";

/** Club id to persist on create/update. */
export function resolvePublishClubId(params: {
  visibility: SessionVisibilityGate;
  primaryClubId: string | null | undefined;
}): string | null {
  const clubId = params.primaryClubId?.trim() || null;
  if (params.visibility === "members") {
    return clubId;
  }
  // Public: keep soft link when the organizer explicitly bound a club.
  return clubId;
}

/** Whether the outing shows “Organisé avec {club}” (public + soft clubId). */
export function isSoftClubAssociated(params: {
  visibility?: string | null;
  clubId?: string | null;
}): boolean {
  return (
    Boolean(params.clubId) &&
    (params.visibility == null || params.visibility === "public")
  );
}
