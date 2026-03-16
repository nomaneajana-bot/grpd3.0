// Commit 6: Assign ≠ join; suggested/left status semantics

import {
  getAssignUpdateData,
  getJoinUpdateData,
  getLeaveUpdateData,
  type AttendanceStatusValue,
} from "../attendanceStatusLogic";

const nonJoinedStatuses: AttendanceStatusValue[] = [
  "suggested",
  "left",
  "requested",
  "waitlisted",
  "declined",
];

describe("attendanceStatusLogic (Commit 6)", () => {
  describe("getAssignUpdateData", () => {
    it("returns only groupId when existing status is joined (do not downgrade)", () => {
      const out = getAssignUpdateData("joined", "B");
      expect(out).toEqual({ groupId: "B" });
      expect(out).not.toHaveProperty("status");
    });

    it("returns groupId and status suggested when no existing attendance", () => {
      const out = getAssignUpdateData(null, "A");
      expect(out).toEqual({ groupId: "A", status: "suggested" });
    });

    it("returns groupId and status suggested for requested, waitlisted, declined, left, suggested", () => {
      for (const status of nonJoinedStatuses) {
        const out = getAssignUpdateData(status, "C");
        expect(out).toEqual({ groupId: "C", status: "suggested" });
      }
    });
  });

  describe("getJoinUpdateData", () => {
    it("returns only groupId when existing status is joined", () => {
      const out = getJoinUpdateData("joined", "D");
      expect(out).toEqual({ groupId: "D" });
      expect(out).not.toHaveProperty("status");
    });

    it("returns groupId and status joined when no existing attendance", () => {
      const out = getJoinUpdateData(null, "A");
      expect(out).toEqual({ groupId: "A", status: "joined" });
    });

    it("returns groupId and status joined for suggested, requested, waitlisted, left, declined (runner confirms)", () => {
      for (const status of nonJoinedStatuses) {
        const out = getJoinUpdateData(status, "B");
        expect(out).toEqual({ groupId: "B", status: "joined" });
      }
    });
  });

  describe("getLeaveUpdateData (Commit 7)", () => {
    it("returns status left and groupId null", () => {
      const out = getLeaveUpdateData();
      expect(out).toEqual({ status: "left", groupId: null });
    });
  });
});
