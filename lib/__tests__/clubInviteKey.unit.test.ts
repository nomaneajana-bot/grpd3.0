import {
  extractInviteCode,
  inviteShareMessage,
  inviteShareUrl,
} from "../clubInviteKey";

describe("clubInviteKey", () => {
  it("extracts bare codes", () => {
    expect(extractInviteCode("jaime1")).toBe("JAIME1");
    expect(extractInviteCode("  CRC2026  ")).toBe("CRC2026");
  });

  it("extracts codes from share links", () => {
    expect(extractInviteCode("https://grpd.run/c/ABC123")).toBe("ABC123");
    expect(extractInviteCode("Rejoins-nous https://grpd.run/c/xyz99 !")).toBe(
      "XYZ99",
    );
  });

  it("builds share payload", () => {
    expect(inviteShareUrl("ab12")).toBe("https://grpd.run/c/AB12");
    expect(inviteShareMessage("ab12", "Marina Run")).toContain("Marina Run");
    expect(inviteShareMessage("ab12", "Marina Run")).toContain("AB12");
  });
});
