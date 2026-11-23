import {
  buildTransferRef,
  sessionPaymentChip,
  clubCotisationChip,
  isActiveSeatStatus,
} from "../hybridPayment";

describe("hybridPayment chips", () => {
  it("maps session statuses to French chips", () => {
    expect(sessionPaymentChip("confirmed_cash")).toBe("Confirmé · Espèces");
    expect(sessionPaymentChip("transfer_pending")).toBe(
      "Confirmé · Virement en attente",
    );
    expect(sessionPaymentChip("paid")).toBe("Payé");
    expect(sessionPaymentChip(null)).toBeNull();
  });

  it("maps cotisation statuses", () => {
    expect(clubCotisationChip("a_jour")).toBe("À jour");
    expect(clubCotisationChip("pending_cash")).toBe("Cotisation · Espèces");
  });

  it("builds transfer refs and active seat check", () => {
    expect(buildTransferRef("GRPD", "demo_sess_paid", "user_abc")).toMatch(
      /^GRPD-/,
    );
    expect(isActiveSeatStatus("confirmed_cash")).toBe(true);
    expect(isActiveSeatStatus("liberated")).toBe(false);
  });
});
