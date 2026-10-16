import {
  isSoftClubAssociated,
  resolvePublishClubId,
} from "../sessionClubAssociation";

describe("session club association (soft link)", () => {
  it("keeps clubId on public when organizer bound a club", () => {
    expect(
      resolvePublishClubId({
        visibility: "public",
        primaryClubId: "club_abc",
      }),
    ).toBe("club_abc");
  });

  it("requires clubId for members-only (caller validates presence)", () => {
    expect(
      resolvePublishClubId({
        visibility: "members",
        primaryClubId: "club_abc",
      }),
    ).toBe("club_abc");
    expect(
      resolvePublishClubId({
        visibility: "members",
        primaryClubId: null,
      }),
    ).toBeNull();
  });

  it("standalone public has no association", () => {
    expect(
      resolvePublishClubId({
        visibility: "public",
        primaryClubId: null,
      }),
    ).toBeNull();
  });

  it("flags soft association only for public + clubId", () => {
    expect(
      isSoftClubAssociated({ visibility: "public", clubId: "c1" }),
    ).toBe(true);
    expect(
      isSoftClubAssociated({ visibility: "members", clubId: "c1" }),
    ).toBe(false);
    expect(
      isSoftClubAssociated({ visibility: "public", clubId: null }),
    ).toBe(false);
  });
});
