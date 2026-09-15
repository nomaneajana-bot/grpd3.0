import { createHash } from "node:crypto";

import { normalizePhone } from "./phone-normalize";

export type PinAllowlistEntry = {
  phone: string;
  pin: string;
  userId?: string;
  profileComplete?: boolean;
};

export type PinAllowlistUser = {
  phone: string;
  pin: string;
  userId: string;
  profileComplete: boolean;
};

function stableUserId(phone: string): string {
  const hash = createHash("sha256").update(phone).digest("hex").slice(0, 24);
  return `user_${hash}`;
}

function parseAllowlist(): PinAllowlistEntry[] {
  const raw = process.env.PIN_ALLOWLIST_JSON?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is PinAllowlistEntry =>
        !!e &&
        typeof e === "object" &&
        typeof (e as PinAllowlistEntry).phone === "string" &&
        typeof (e as PinAllowlistEntry).pin === "string",
    );
  } catch {
    return [];
  }
}

let cached: PinAllowlistUser[] | null = null;

export function isPinAllowlistEnabled(): boolean {
  return parseAllowlist().length > 0;
}

export function getPinAllowlistUsers(): PinAllowlistUser[] {
  if (cached) return cached;
  cached = parseAllowlist().map((entry) => {
    const phone = normalizePhone(entry.phone);
    return {
      phone,
      pin: entry.pin,
      userId: entry.userId?.trim() || stableUserId(phone),
      profileComplete: entry.profileComplete ?? true,
    };
  });
  return cached;
}

export function findAllowlistUser(
  phone: string,
  pin: string,
): PinAllowlistUser | null {
  const normalized = normalizePhone(phone);
  return (
    getPinAllowlistUsers().find(
      (u) => u.phone === normalized && u.pin === pin,
    ) ?? null
  );
}
