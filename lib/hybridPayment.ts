/** Hybrid cash / virement — Prop1 sessions, Prop2 strict window, Prop3 club dues. */

export const VIREMENT_WINDOW_MINUTES = 45;
export const VIREMENT_WINDOW_MS = VIREMENT_WINDOW_MINUTES * 60 * 1000;

export type PaymentModality = "cash" | "transfer";

/** Session participation money status (local sticky demo). */
export type SessionPaymentStatus =
  | "confirmed_cash"
  | "awaiting_declare"
  | "transfer_pending"
  | "paid"
  | "liberated";

export type ClubCotisationStatus =
  | "pending_cash"
  | "awaiting_declare"
  | "transfer_pending"
  | "a_jour";

export type SessionPaymentConfig = {
  feeMad: number;
  /** Prop2 — virement hold expires if J’ai viré not tapped in window. */
  strict: boolean;
  ribAlias: string;
  /** Shown on RIB sheet; {ref} filled at join time. */
  transferRefPrefix: string;
};

/** Demo club dues (Prop3). */
export const DEMO_CLUB_COTISATION: Record<
  string,
  { amountMad: number; periodLabel: string; ribAlias: string }
> = {
  club_jaime_courir: {
    amountMad: 200,
    periodLabel: "Mensuelle",
    ribAlias: "CIH · j’aime courir",
  },
};

export function clubCotisationConfig(clubId: string | null | undefined) {
  if (!clubId) return null;
  return DEMO_CLUB_COTISATION[clubId] ?? null;
}

export function sessionPaymentChip(
  status: SessionPaymentStatus | null | undefined,
): string | null {
  switch (status) {
    case "confirmed_cash":
      return "Confirmé · Espèces";
    case "awaiting_declare":
    case "transfer_pending":
      return "Confirmé · Virement en attente";
    case "paid":
      return "Payé";
    default:
      return null;
  }
}

export function clubCotisationChip(
  status: ClubCotisationStatus | null | undefined,
): string | null {
  switch (status) {
    case "pending_cash":
      return "Cotisation · Espèces";
    case "awaiting_declare":
    case "transfer_pending":
      return "Cotisation · Virement en attente";
    case "a_jour":
      return "À jour";
    default:
      return null;
  }
}

export function buildTransferRef(prefix: string, sessionId: string, userId: string): string {
  const s = sessionId.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "SESS";
  const u = userId.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "USER";
  return `${prefix}-${s}-${u}`;
}

export function isActiveSeatStatus(
  status: SessionPaymentStatus | null | undefined,
): boolean {
  return (
    status === "confirmed_cash" ||
    status === "awaiting_declare" ||
    status === "transfer_pending" ||
    status === "paid"
  );
}
