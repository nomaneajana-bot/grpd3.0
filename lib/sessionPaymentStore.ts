import AsyncStorage from "@react-native-async-storage/async-storage";

import { getAuthUser } from "./authStore";
import { removeJoinedSession } from "./joinedSessionsStore";
import {
  isActiveSeatStatus,
  type PaymentModality,
  type SessionPaymentStatus,
  VIREMENT_WINDOW_MS,
} from "./hybridPayment";

export type SessionPaymentRecord = {
  sessionId: string;
  modality: PaymentModality;
  status: SessionPaymentStatus;
  modalityChosenAt: number;
  transferDeclaredAt?: number;
  paidAt?: number;
  transferRef?: string;
  amountMad: number;
  strict: boolean;
};

const KEY_PREFIX = "grpd_session_payment_v1:";

function keyForUser(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

async function resolveUserId(): Promise<string | null> {
  try {
    return (await getAuthUser())?.id ?? null;
  } catch {
    return null;
  }
}

async function loadAll(): Promise<Record<string, SessionPaymentRecord>> {
  const userId = await resolveUserId();
  if (!userId) return {};
  try {
    const raw = await AsyncStorage.getItem(keyForUser(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, SessionPaymentRecord>;
  } catch {
    return {};
  }
}

async function saveAll(map: Record<string, SessionPaymentRecord>): Promise<void> {
  const userId = await resolveUserId();
  if (!userId) return;
  await AsyncStorage.setItem(keyForUser(userId), JSON.stringify(map));
}

/** Expire Prop2 holds where J’ai viré was never tapped. Returns liberated session ids. */
export async function expireStrictTransferHolds(
  now = Date.now(),
): Promise<string[]> {
  const map = await loadAll();
  const freed: string[] = [];
  let dirty = false;
  for (const [id, rec] of Object.entries(map)) {
    if (
      rec.strict &&
      rec.status === "awaiting_declare" &&
      now - rec.modalityChosenAt >= VIREMENT_WINDOW_MS
    ) {
      map[id] = { ...rec, status: "liberated" };
      freed.push(id);
      dirty = true;
    }
  }
  if (dirty) {
    await saveAll(map);
    for (const id of freed) {
      try {
        await removeJoinedSession(id);
      } catch {
        /* seat liberate still recorded in payment store */
      }
    }
  }
  return freed;
}

export async function getSessionPayment(
  sessionId: string,
): Promise<SessionPaymentRecord | null> {
  await expireStrictTransferHolds();
  const map = await loadAll();
  const rec = map[sessionId];
  if (!rec || rec.status === "liberated") return null;
  return rec;
}

export async function getAllSessionPayments(): Promise<
  Record<string, SessionPaymentRecord>
> {
  await expireStrictTransferHolds();
  const map = await loadAll();
  const out: Record<string, SessionPaymentRecord> = {};
  for (const [id, rec] of Object.entries(map)) {
    if (isActiveSeatStatus(rec.status)) out[id] = rec;
  }
  return out;
}

export async function upsertSessionPayment(
  record: SessionPaymentRecord,
): Promise<void> {
  const map = await loadAll();
  map[record.sessionId] = record;
  await saveAll(map);
}

export async function markSessionTransferDeclared(
  sessionId: string,
): Promise<SessionPaymentRecord | null> {
  const map = await loadAll();
  const rec = map[sessionId];
  if (!rec) return null;
  const next: SessionPaymentRecord = {
    ...rec,
    status: "transfer_pending",
    transferDeclaredAt: Date.now(),
  };
  map[sessionId] = next;
  await saveAll(map);
  return next;
}

export async function markSessionPaid(
  sessionId: string,
): Promise<SessionPaymentRecord | null> {
  const map = await loadAll();
  const rec = map[sessionId];
  if (!rec) return null;
  const next: SessionPaymentRecord = {
    ...rec,
    status: "paid",
    paidAt: Date.now(),
  };
  map[sessionId] = next;
  await saveAll(map);
  return next;
}

/** Organizer liberates seat (Non reçu) — clears active payment. */
export async function liberateSessionPayment(
  sessionId: string,
): Promise<void> {
  const map = await loadAll();
  const rec = map[sessionId];
  if (!rec) return;
  map[sessionId] = { ...rec, status: "liberated" };
  await saveAll(map);
}

export async function clearSessionPayment(sessionId: string): Promise<void> {
  const map = await loadAll();
  delete map[sessionId];
  await saveAll(map);
}

/** Prefix keys for demo reset. */
export const SESSION_PAYMENT_KEY_PREFIX = KEY_PREFIX;
