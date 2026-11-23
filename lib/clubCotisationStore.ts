import AsyncStorage from "@react-native-async-storage/async-storage";

import { getAuthUser } from "./authStore";
import type { ClubCotisationStatus, PaymentModality } from "./hybridPayment";

export type ClubCotisationRecord = {
  clubId: string;
  modality: PaymentModality;
  status: ClubCotisationStatus;
  modalityChosenAt: number;
  transferDeclaredAt?: number;
  aJourAt?: number;
  transferRef?: string;
  amountMad: number;
};

const KEY_PREFIX = "grpd_club_cotisation_v1:";

export const CLUB_COTISATION_KEY_PREFIX = KEY_PREFIX;

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

async function loadAll(): Promise<Record<string, ClubCotisationRecord>> {
  const userId = await resolveUserId();
  if (!userId) return {};
  try {
    const raw = await AsyncStorage.getItem(keyForUser(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, ClubCotisationRecord>;
  } catch {
    return {};
  }
}

async function saveAll(map: Record<string, ClubCotisationRecord>): Promise<void> {
  const userId = await resolveUserId();
  if (!userId) return;
  await AsyncStorage.setItem(keyForUser(userId), JSON.stringify(map));
}

export async function getClubCotisation(
  clubId: string,
): Promise<ClubCotisationRecord | null> {
  const map = await loadAll();
  return map[clubId] ?? null;
}

export async function isClubAJour(clubId: string): Promise<boolean> {
  const rec = await getClubCotisation(clubId);
  return rec?.status === "a_jour";
}

export async function upsertClubCotisation(
  record: ClubCotisationRecord,
): Promise<void> {
  const map = await loadAll();
  map[record.clubId] = record;
  await saveAll(map);
}

export async function markClubTransferDeclared(
  clubId: string,
): Promise<ClubCotisationRecord | null> {
  const map = await loadAll();
  const rec = map[clubId];
  if (!rec) return null;
  const next: ClubCotisationRecord = {
    ...rec,
    status: "transfer_pending",
    transferDeclaredAt: Date.now(),
  };
  map[clubId] = next;
  await saveAll(map);
  return next;
}

/** Organizer marks member À jour (demo: self or host). */
export async function markClubAJour(
  clubId: string,
): Promise<ClubCotisationRecord | null> {
  const map = await loadAll();
  const rec = map[clubId];
  if (!rec) return null;
  const next: ClubCotisationRecord = {
    ...rec,
    status: "a_jour",
    aJourAt: Date.now(),
  };
  map[clubId] = next;
  await saveAll(map);
  return next;
}

export async function clearClubCotisation(clubId: string): Promise<void> {
  const map = await loadAll();
  delete map[clubId];
  await saveAll(map);
}
