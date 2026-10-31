import { displayInitial, resolveDisplayName } from "../displayName";

describe("resolveDisplayName", () => {
  it("prefers profile firstName", () => {
    expect(
      resolveDisplayName({
        profile: {
          name: "Old",
          firstName: "Camille",
          vo2max: null,
          weightKg: null,
          mainGoal: "10k",
        },
        authUser: {
          id: "u1",
          phone: "",
          email: "x@y.com",
          name: "Auth",
          profileComplete: true,
        },
      }),
    ).toBe("Camille");
  });

  it("falls back to auth name then email local-part", () => {
    expect(
      resolveDisplayName({
        profile: null,
        authUser: {
          id: "u1",
          phone: "",
          email: "nour@example.com",
          name: "Nour",
          profileComplete: true,
        },
      }),
    ).toBe("Nour");
    expect(
      resolveDisplayName({
        profile: null,
        authUser: {
          id: "u1",
          phone: "",
          email: "nour@example.com",
          name: null,
          profileComplete: true,
        },
      }),
    ).toBe("nour");
  });

  it("uses Coureur only as last resort", () => {
    expect(resolveDisplayName({ profile: null, authUser: null })).toBe(
      "Coureur",
    );
  });
});

describe("displayInitial", () => {
  it("uppercases first letter", () => {
    expect(displayInitial("nour")).toBe("N");
    expect(displayInitial("")).toBe("?");
  });
});
