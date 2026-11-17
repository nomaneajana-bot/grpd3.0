import { MembershipRole, MembershipStatus } from "@prisma/client";
import { evaluateLeaveEligibility } from "../server/clubMembershipLifecycle";

const API_JARGON = /cancel-request|\bleave\b|\/api\/|transfert\/suppression|suppression invent/i;

describe("evaluateLeaveEligibility", () => {
  it("allows idempotent leave when membership already absent", () => {
    const r = evaluateLeaveEligibility({
      membership: null,
      otherApprovedAdminCount: 0,
    });
    expect(r).toEqual({
      ok: true,
      alreadyAbsent: true,
      revokedAttendance: 0,
    });
  });

  it("rejects pending membership with user-facing French (no API jargon)", () => {
    const r = evaluateLeaveEligibility({
      membership: {
        status: MembershipStatus.pending,
        role: MembershipRole.member,
      },
      otherApprovedAdminCount: 0,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("WRONG_STATUS");
      expect(r.message).toMatch(/attente|annule/i);
      expect(r.message).not.toMatch(API_JARGON);
    }
  });

  it("rejects sole approved admin leave with user-facing French (no invent jargon)", () => {
    const r = evaluateLeaveEligibility({
      membership: {
        status: MembershipStatus.approved,
        role: MembershipRole.admin,
      },
      otherApprovedAdminCount: 0,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("LAST_ADMIN");
      expect(r.message).toMatch(/dernier administrateur/i);
      expect(r.message).not.toMatch(API_JARGON);
    }
  });

  it("allows approved member leave", () => {
    const r = evaluateLeaveEligibility({
      membership: {
        status: MembershipStatus.approved,
        role: MembershipRole.member,
      },
      otherApprovedAdminCount: 0,
    });
    expect(r).toEqual({ ok: true, proceed: true });
  });

  it("allows admin leave when another approved admin remains", () => {
    const r = evaluateLeaveEligibility({
      membership: {
        status: MembershipStatus.approved,
        role: MembershipRole.admin,
      },
      otherApprovedAdminCount: 1,
    });
    expect(r).toEqual({ ok: true, proceed: true });
  });
});
