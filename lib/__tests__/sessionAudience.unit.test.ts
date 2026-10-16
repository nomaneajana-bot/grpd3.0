import {
  fieldsToSessionAudience,
  normalizeSessionAudience,
  SESSION_AUDIENCE_OPTIONS,
  sessionAudienceToFields,
} from "../sessionAudience";

describe("session audience simplify v1", () => {
  it("exposes only open vs club access chips", () => {
    expect(SESSION_AUDIENCE_OPTIONS.map((o) => o.id)).toEqual([
      "public",
      "club",
    ]);
    expect(SESSION_AUDIENCE_OPTIONS.some((o) => /Femmes|Équipe/i.test(o.label))).toBe(
      false,
    );
  });

  it("maps club audience to members visibility", () => {
    expect(sessionAudienceToFields("club").visibility).toBe("members");
    expect(sessionAudienceToFields("team").visibility).toBe("members");
    expect(sessionAudienceToFields("team").hostGroupName).toBeNull();
  });

  it("maps legacy femmes to open (no fake gate)", () => {
    const fields = sessionAudienceToFields("women");
    expect(fields.visibility).toBe("public");
    expect(fields.genderRestrictionUi).toBeNull();
  });

  it("reads stored sessions into two modes", () => {
    expect(fieldsToSessionAudience("members", "women_only", "Équipe")).toBe(
      "club",
    );
    expect(fieldsToSessionAudience("public", "women", null)).toBe("public");
  });

  it("normalizes route audience params", () => {
    expect(normalizeSessionAudience("team")).toBe("club");
    expect(normalizeSessionAudience("women")).toBe("public");
    expect(normalizeSessionAudience("public")).toBe("public");
  });
});
