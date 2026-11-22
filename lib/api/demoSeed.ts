/**
 * Casablanca demo world for EXPO_PUBLIC_DEMO_MODE.
 * Purely AsyncStorage — no Prisma / API routes.
 *
 * Invariants:
 * - members-only sessions always have clubId
 * - group identity only via attendance.groupId (no profile group)
 * - assign ≠ join (seed only writes joined via explicit attendance rows)
 * - no auto-confirm
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  ApiSession,
  AttendanceStatus,
  AuthUser,
  Club,
  ClubMembership,
  SessionParticipant,
  SessionParticipantsResult,
} from "../../types/api";
import { DEMO_MODE } from "../featureFlags";
import { OUTING_COVERS } from "../outingCovers";
import {
  DEMO_COACH_PRIMARY,
  DEMO_COACH_SECONDARY,
  DEMO_PEOPLE,
  demoHostUserIdForName,
  type DemoPerson,
} from "./demoRoster";
export { DEMO_PEOPLE } from "./demoRoster";

export const MOCK_SESSIONS_KEY = "mock:sessions";
export const MOCK_ATTENDANCE_KEY = "mock:attendance";
export const MOCK_USERS_KEY = "mock:users";
export const MOCK_PINS_KEY = "mock:pins";
export const MOCK_CLUBS_KEY = "mock:clubs";
export const MOCK_MEMBERSHIPS_KEY = "mock:club_memberships";
export const MOCK_OTP_KEY = "mock:otp";
/** Bump to force a one-time reseed of the richer Casablanca world. */
export const MOCK_DEMO_SEEDED_KEY = "mock:demo_seeded_v5";
/** v13: Accueil full of public Course/Marche sorties (j’aime courir only). */
export const DEMO_SEED_VERSION = "13";

/** Distinct outing covers — live Unsplash IDs only (verified HTTP 200). */
const COVER = OUTING_COVERS;

export const DEMO_CLUB_ID = "club_jaime_courir";
export const DEMO_CLUB_NAME = "j’aime courir";
export const DEMO_CLUB_CODE = "JAIME26";
export const DEMO_CLUB_CITY = "Casablanca";
export const DEMO_CLUB_DESCRIPTION =
  "Club de course à pied Casablanca — Circuit Rodriguez, Marina Juice, Vélodrome. Sorties pour tous les niveaux.";

export const DEMO_WALK_CLUB_ID = "club_casa_marche";
export const DEMO_WALK_CLUB_NAME = "Casa Marche Douce";
export const DEMO_WALK_CLUB_CODE = "MARCHE26";

export const DEMO_LANG_CLUB_ID = "club_french_run_talk";
export const DEMO_LANG_CLUB_NAME = "French Run & Talk";
export const DEMO_LANG_CLUB_CODE = "FRTALK26";

/** Removed in seed v12 — only j’aime courir. */
export const DEMO_DIVERSITY_CLUBS = [] as const;
export type DemoDiversityClubId = string;


export type MockAttendance = {
  id: string;
  sessionId: string;
  userId: string;
  displayName: string;
  groupId: "A" | "B" | "C" | "D" | null;
  status: AttendanceStatus;
};

type MockSessionMap = Record<string, ApiSession>;
type MockAttendanceMap = Record<string, MockAttendance>;
type MockClubMap = Record<string, Club & { code: string }>;
type MockMembershipMap = Record<string, ClubMembership>;

const DAY_MS = 24 * 60 * 60 * 1000;

const PACE_GROUPS_ABCD: NonNullable<ApiSession["paceGroups"]> = [
  {
    id: "A",
    label: "Groupe A",
    paceRange: "4'00–4'30/km",
    runnersCount: 2,
    avgPaceSecondsPerKm: 255,
  },
  {
    id: "B",
    label: "Groupe B",
    paceRange: "4'30–5'30/km",
    runnersCount: 4,
    avgPaceSecondsPerKm: 300,
  },
  {
    id: "C",
    label: "Groupe C",
    paceRange: "5'30–6'30/km",
    runnersCount: 5,
    avgPaceSecondsPerKm: 360,
  },
  {
    id: "D",
    label: "Groupe D",
    paceRange: "6'30+/km",
    runnersCount: 3,
    avgPaceSecondsPerKm: 420,
  },
];

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function formatDateLabel(d: Date, timeMinutes: number): string {
  const days = [
    "DIMANCHE",
    "LUNDI",
    "MARDI",
    "MERCREDI",
    "JEUDI",
    "VENDREDI",
    "SAMEDI",
  ];
  const months = [
    "JANVIER",
    "FÉVRIER",
    "MARS",
    "AVRIL",
    "MAI",
    "JUIN",
    "JUILLET",
    "AOÛT",
    "SEPTEMBRE",
    "OCTOBRE",
    "NOVEMBRE",
    "DÉCEMBRE",
  ];
  const h = Math.floor(timeMinutes / 60);
  const m = timeMinutes % 60;
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} · ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function makePrSummary(paceSecondsPerKm: number) {
  return {
    updatedAt: new Date().toISOString(),
    records: [
      {
        label: "10 km",
        paceSecondsPerKm,
        testDate: "2025-11-01",
        distanceMeters: 10000,
        durationSeconds: Math.round((paceSecondsPerKm * 10000) / 1000),
      },
    ],
  };
}

function groupForPace(paceSecondsPerKm: number): "A" | "B" | "C" | "D" {
  if (paceSecondsPerKm < 280) return "A";
  if (paceSecondsPerKm < 330) return "B";
  if (paceSecondsPerKm < 390) return "C";
  return "D";
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function buildDemoSessions(): ApiSession[] {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );

  type Spec = {
    id: string;
    title: string;
    spot: string;
    dayOffset: number;
    timeMinutes: number;
    typeLabel: string;
    volume: string;
    targetPace: string;
    estimatedDistanceKm: number;
    visibility: "public" | "members";
    withPaceGroups: boolean;
    coachName: string;
    coachPhone: string;
    recommendedGroupId: string;
  };

  type SpecExtra = Spec & {
    clubId?: string | null;
    purpose?: string;
    pastDaysAgo?: number;
    genderRestriction?: "women_only" | "none";
    openRunners?: number;
    coverImageUrl?: string | null;
    /** Club / community name shown as Accueil host for jury clarity. */
    hostGroupName?: string | null;
    feeMad?: number;
    paymentStrict?: boolean;
    ribAlias?: string;
    transferRefPrefix?: string;
    requiresClubCotisation?: boolean;
  };

  // Accueil discovery = public only, filtered by selected day.
  // Seed late tonight (survives evening demos) + fill the next 6 days.
  const H = {
    abdelali: DEMO_COACH_PRIMARY.displayName,
    ilham: DEMO_COACH_SECONDARY.displayName,
    walid: "Walid Tagmout",
    ghizlane: "Ghizlane Rabhi",
    youness: "Youness Machkour",
    fatima: "Fatima Mechkouk",
    nora: "Nora El Jamal",
    mohamed: "Mohamed Oubenaakka",
    laila: "Laila Nasr",
    hamza: "Hamza Regui",
    meriem: "Meriem Esseda",
    ines: "Ines Rajiallah",
  } as const;

  const specs: SpecExtra[] = [
    // ——— Today (late) — Accueil default day ———
    {
      id: "demo_sess_footing_rodriguez",
      title: "Footing Circuit Rodriguez",
      spot: "Circuit Rodriguez, Casablanca",
      dayOffset: 0,
      timeMinutes: 21 * 60 + 30,
      typeLabel: "FOOTING",
      volume: "45 min · allure facile",
      targetPace: "5:30–6:30/km",
      estimatedDistanceKm: 8,
      visibility: "public",
      withPaceGroups: true,
      coachName: H.abdelali,
      coachPhone: "+212600000001",
      recommendedGroupId: "C",
      purpose: "Sortie phare j’aime courir — Circuit Rodriguez.",
      coverImageUrl: COVER.packRoad,
      openRunners: 14,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    {
      id: "demo_sess_marche_marina_soir",
      title: "Marche douce Marina Juice",
      spot: "Marina Juice, Casablanca",
      dayOffset: 0,
      timeMinutes: 21 * 60,
      typeLabel: "MARCHE",
      volume: "40 min · pas conversation",
      targetPace: "—",
      estimatedDistanceKm: 4,
      visibility: "public",
      withPaceGroups: false,
      coachName: H.ilham,
      coachPhone: "+212600000002",
      recommendedGroupId: "D",
      purpose: "Boucle marina en soirée — rythme marche.",
      coverImageUrl: COVER.walkPark,
      openRunners: 11,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    {
      id: "demo_sess_corniche_night",
      title: "Course Corniche de nuit",
      spot: "Corniche El Hank",
      dayOffset: 0,
      timeMinutes: 22 * 60,
      typeLabel: "COURSE",
      volume: "8 km · allure confort",
      targetPace: "5:45–6:45/km",
      estimatedDistanceKm: 8,
      visibility: "public",
      withPaceGroups: true,
      coachName: H.walid,
      coachPhone: "+212600000010",
      recommendedGroupId: "C",
      purpose: "Aller-retour Corniche sous les lampadaires.",
      coverImageUrl: COVER.cornicheDawn,
      openRunners: 10,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    // ——— Tomorrow ———
    {
      id: "demo_sess_marina_juice",
      title: "Footing Marina Juice",
      spot: "Marina Juice, Casablanca",
      dayOffset: 1,
      timeMinutes: 7 * 60 + 30,
      typeLabel: "FOOTING",
      volume: "40 min · rythme cool",
      targetPace: "5:45–6:45/km",
      estimatedDistanceKm: 7,
      visibility: "public",
      withPaceGroups: true,
      coachName: H.ilham,
      coachPhone: "+212600000002",
      recommendedGroupId: "C",
      purpose: "Matinée Marina Juice — café après l’effort.",
      coverImageUrl: COVER.waterfront,
      openRunners: 12,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    {
      id: "demo_sess_velodrome_series",
      title: "Séries Vélodrome",
      spot: "Vélodrome Casablanca",
      dayOffset: 1,
      timeMinutes: 7 * 60,
      typeLabel: "SERIES",
      volume: "10×400 m · récup 90s",
      targetPace: "4:00–5:00/km",
      estimatedDistanceKm: 6,
      visibility: "public",
      withPaceGroups: true,
      coachName: H.abdelali,
      coachPhone: "+212600000001",
      recommendedGroupId: "B",
      purpose: "Travail de vitesse au Vélodrome — groupes A–D.",
      coverImageUrl: COVER.trackNight,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    {
      id: "demo_sess_marche_ligue",
      title: "Marche Parc de la Ligue",
      spot: "Parc de la Ligue Arabe",
      dayOffset: 1,
      timeMinutes: 18 * 60,
      typeLabel: "MARCHE",
      volume: "50 min · découverte",
      targetPace: "—",
      estimatedDistanceKm: 5,
      visibility: "public",
      withPaceGroups: false,
      coachName: H.laila,
      coachPhone: "+212600000011",
      recommendedGroupId: "D",
      purpose: "Tour du parc à pied — tous niveaux.",
      coverImageUrl: COVER.trailLight,
      openRunners: 13,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    {
      id: "demo_sess_paid_corniche",
      title: "Footing payant — Marina Juice",
      spot: "Marina Juice, Casablanca",
      dayOffset: 1,
      timeMinutes: 18 * 60 + 30,
      typeLabel: "FOOTING · Payant",
      volume: "50 min · allure confort",
      targetPace: "5:30–6:30/km",
      estimatedDistanceKm: 9,
      visibility: "public",
      withPaceGroups: true,
      coachName: H.abdelali,
      coachPhone: "+212600000001",
      recommendedGroupId: "C",
      purpose: "Prop1 — 50 MAD · Espèces ou Virement avant d’avoir la place.",
      coverImageUrl: COVER.packRoad,
      openRunners: 8,
      feeMad: 50,
      ribAlias: "CIH · j’aime courir",
      transferRefPrefix: "GRPD",
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    // ——— +2 ———
    {
      id: "demo_sess_anfa_run",
      title: "Footing Anfa Park",
      spot: "Anfa Park",
      dayOffset: 2,
      timeMinutes: 7 * 60,
      typeLabel: "FOOTING",
      volume: "45 min · endurance",
      targetPace: "5:15–6:15/km",
      estimatedDistanceKm: 9,
      visibility: "public",
      withPaceGroups: true,
      coachName: H.youness,
      coachPhone: "+212600000012",
      recommendedGroupId: "B",
      purpose: "Boucles Anfa — groupes A–D.",
      coverImageUrl: COVER.cityStride,
      openRunners: 15,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    {
      id: "demo_sess_paid_strict_piste",
      title: "Séries payantes — places limitées",
      spot: "Vélodrome Casablanca",
      dayOffset: 2,
      timeMinutes: 7 * 60 + 30,
      typeLabel: "SERIES · Strict",
      volume: "8×400 m · récup 90s",
      targetPace: "4:00–5:00/km",
      estimatedDistanceKm: 6,
      visibility: "public",
      withPaceGroups: true,
      coachName: H.ilham,
      coachPhone: "+212600000002",
      recommendedGroupId: "B",
      purpose:
        "Prop2 — 80 MAD strict · Virement : J’ai viré sous 45 min sinon place libérée.",
      coverImageUrl: COVER.trackNight,
      openRunners: 6,
      feeMad: 80,
      paymentStrict: true,
      ribAlias: "CIH · j’aime courir Vélodrome",
      transferRefPrefix: "STRICT",
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    {
      id: "demo_sess_marche_ain_diab",
      title: "Marche Ain Diab",
      spot: "Ain Diab",
      dayOffset: 2,
      timeMinutes: 18 * 60 + 30,
      typeLabel: "MARCHE",
      volume: "55 min · bord de mer",
      targetPace: "—",
      estimatedDistanceKm: 5,
      visibility: "public",
      withPaceGroups: false,
      coachName: H.nora,
      coachPhone: "+212600000013",
      recommendedGroupId: "D",
      purpose: "Marche front de mer — rythme libre.",
      coverImageUrl: COVER.waterfront,
      openRunners: 12,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    {
      id: "demo_sess_soir_members",
      title: "Allure confort club",
      spot: "Circuit Rodriguez, Casablanca",
      dayOffset: 2,
      timeMinutes: 19 * 60,
      typeLabel: "FOOTING",
      volume: "8 km · groupes A–D",
      targetPace: "5:00–6:30/km",
      estimatedDistanceKm: 8,
      visibility: "members",
      withPaceGroups: true,
      coachName: H.ghizlane,
      coachPhone: "+212600000014",
      recommendedGroupId: "C",
      purpose: "Sortie club du soir — choisis ton groupe.",
      coverImageUrl: COVER.packRoad,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    {
      id: "demo_sess_club_cotisation_outing",
      title: "Sortie membres à jour",
      spot: "Circuit Rodriguez, Casablanca",
      dayOffset: 2,
      timeMinutes: 19 * 60 + 30,
      typeLabel: "FOOTING · Club",
      volume: "45 min · allure libre",
      targetPace: "5:30–6:30/km",
      estimatedDistanceKm: 8,
      visibility: "members",
      withPaceGroups: false,
      coachName: H.abdelali,
      coachPhone: "+212600000001",
      recommendedGroupId: "C",
      purpose:
        "Prop3 — membres à jour = 1 tap ; sinon cotisation ou 40 MAD invitée.",
      coverImageUrl: COVER.packRoad,
      openRunners: 11,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
      requiresClubCotisation: true,
      feeMad: 40,
      ribAlias: "CIH · j’aime courir",
      transferRefPrefix: "COTIS",
    },
    // ——— +3 ———
    {
      id: "demo_sess_footing_sunset",
      title: "Footing coucher de soleil",
      spot: "Marina Juice, Casablanca",
      dayOffset: 3,
      timeMinutes: 18 * 60,
      typeLabel: "FOOTING",
      volume: "50 min · conversation",
      targetPace: "6:00–7:00/km",
      estimatedDistanceKm: 7,
      visibility: "public",
      withPaceGroups: false,
      coachName: H.meriem,
      coachPhone: "+212600000015",
      recommendedGroupId: "D",
      purpose: "Boucle douce autour de la Marina.",
      coverImageUrl: COVER.longRun,
      openRunners: 10,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    {
      id: "demo_sess_bouskoura_long",
      title: "Long run Bouskoura",
      spot: "Forêt de Bouskoura",
      dayOffset: 3,
      timeMinutes: 8 * 60,
      typeLabel: "COURSE",
      volume: "14 km · endurance",
      targetPace: "5:30–6:30/km",
      estimatedDistanceKm: 14,
      visibility: "public",
      withPaceGroups: true,
      coachName: H.mohamed,
      coachPhone: "+212600000016",
      recommendedGroupId: "C",
      purpose: "Sortie longue en forêt — emporte de l’eau.",
      coverImageUrl: COVER.trailLight,
      openRunners: 16,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    {
      id: "demo_sess_marche_maarif",
      title: "Marche quartier Maarif",
      spot: "Maarif",
      dayOffset: 3,
      timeMinutes: 19 * 60,
      typeLabel: "MARCHE",
      volume: "45 min · urbain",
      targetPace: "—",
      estimatedDistanceKm: 4,
      visibility: "public",
      withPaceGroups: false,
      coachName: H.fatima,
      coachPhone: "+212600000017",
      recommendedGroupId: "D",
      purpose: "Marche de quartier — rythme cool.",
      coverImageUrl: COVER.womenPack,
      openRunners: 9,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    // ——— +4 ———
    {
      id: "demo_sess_rodriguez_matin",
      title: "Footing matinal Rodriguez",
      spot: "Circuit Rodriguez, Casablanca",
      dayOffset: 4,
      timeMinutes: 6 * 60 + 45,
      typeLabel: "FOOTING",
      volume: "40 min · réveil muscles",
      targetPace: "5:30–6:30/km",
      estimatedDistanceKm: 7,
      visibility: "public",
      withPaceGroups: true,
      coachName: H.hamza,
      coachPhone: "+212600000018",
      recommendedGroupId: "C",
      purpose: "Départ tôt — Circuit Rodriguez.",
      coverImageUrl: COVER.packRoad,
      openRunners: 11,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    {
      id: "demo_sess_velodrome_tempo",
      title: "Tempo Vélodrome",
      spot: "Vélodrome Casablanca",
      dayOffset: 4,
      timeMinutes: 18 * 60 + 15,
      typeLabel: "SERIES",
      volume: "5×1000 m · récup 2 min",
      targetPace: "4:15–5:00/km",
      estimatedDistanceKm: 8,
      visibility: "public",
      withPaceGroups: true,
      coachName: H.abdelali,
      coachPhone: "+212600000001",
      recommendedGroupId: "B",
      purpose: "Qualité piste — emporte des pointes si tu as.",
      coverImageUrl: COVER.trackNight,
      openRunners: 10,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    {
      id: "demo_sess_marche_marina_matin",
      title: "Marche café Marina",
      spot: "Marina",
      dayOffset: 4,
      timeMinutes: 9 * 60,
      typeLabel: "MARCHE",
      volume: "35 min · soft",
      targetPace: "—",
      estimatedDistanceKm: 3,
      visibility: "public",
      withPaceGroups: false,
      coachName: H.ines,
      coachPhone: "+212600000019",
      recommendedGroupId: "D",
      purpose: "Marche puis café — rythme découverte.",
      coverImageUrl: COVER.walkPark,
      openRunners: 8,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    // ——— +5 ———
    {
      id: "demo_sess_corniche_sunrise",
      title: "Course lever de soleil",
      spot: "Corniche El Hank",
      dayOffset: 5,
      timeMinutes: 6 * 60 + 30,
      typeLabel: "COURSE",
      volume: "10 km · easy",
      targetPace: "5:45–6:45/km",
      estimatedDistanceKm: 10,
      visibility: "public",
      withPaceGroups: true,
      coachName: H.walid,
      coachPhone: "+212600000010",
      recommendedGroupId: "C",
      purpose: "Corniche au lever du jour.",
      coverImageUrl: COVER.cornicheDawn,
      openRunners: 14,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    {
      id: "demo_sess_marche_rodriguez",
      title: "Marche Circuit Rodriguez",
      spot: "Circuit Rodriguez, Casablanca",
      dayOffset: 5,
      timeMinutes: 18 * 60,
      typeLabel: "MARCHE",
      volume: "50 min · récup active",
      targetPace: "—",
      estimatedDistanceKm: 5,
      visibility: "public",
      withPaceGroups: false,
      coachName: H.ghizlane,
      coachPhone: "+212600000014",
      recommendedGroupId: "D",
      purpose: "Récupération en marchant sur le circuit.",
      coverImageUrl: COVER.trailLight,
      openRunners: 10,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    // ——— +6 ———
    {
      id: "demo_sess_week_end_pack",
      title: "Pack week-end Anfa",
      spot: "Anfa Park",
      dayOffset: 6,
      timeMinutes: 9 * 60,
      typeLabel: "FOOTING",
      volume: "12 km · social",
      targetPace: "5:30–6:45/km",
      estimatedDistanceKm: 12,
      visibility: "public",
      withPaceGroups: true,
      coachName: H.ilham,
      coachPhone: "+212600000002",
      recommendedGroupId: "C",
      purpose: "Sortie week-end — photo de groupe à la fin.",
      coverImageUrl: COVER.cityStride,
      openRunners: 18,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    {
      id: "demo_sess_marche_bouskoura",
      title: "Marche forêt Bouskoura",
      spot: "Forêt de Bouskoura",
      dayOffset: 6,
      timeMinutes: 10 * 60 + 30,
      typeLabel: "MARCHE",
      volume: "60 min · nature",
      targetPace: "—",
      estimatedDistanceKm: 6,
      visibility: "public",
      withPaceGroups: false,
      coachName: H.nora,
      coachPhone: "+212600000013",
      recommendedGroupId: "D",
      purpose: "Marche en sous-bois — chaussures confort.",
      coverImageUrl: COVER.trailLight,
      openRunners: 12,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    // ——— Past (Mes Sorties history) ———
    {
      id: "demo_sess_past_footing",
      title: "Footing du week-end",
      spot: "Circuit Rodriguez, Casablanca",
      dayOffset: 0,
      pastDaysAgo: 3,
      timeMinutes: 9 * 60,
      typeLabel: "FOOTING",
      volume: "10 km · endurance",
      targetPace: "5:30–6:30/km",
      estimatedDistanceKm: 10,
      visibility: "public",
      withPaceGroups: true,
      coachName: H.abdelali,
      coachPhone: "+212600000001",
      recommendedGroupId: "C",
      coverImageUrl: COVER.packRoad,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    {
      id: "demo_sess_past_velodrome",
      title: "Séries Vélodrome (passée)",
      spot: "Vélodrome Casablanca",
      dayOffset: 0,
      pastDaysAgo: 5,
      timeMinutes: 7 * 60,
      typeLabel: "SERIES",
      volume: "8×400 m",
      targetPace: "4:15–5:00/km",
      estimatedDistanceKm: 5,
      visibility: "members",
      withPaceGroups: true,
      coachName: H.ilham,
      coachPhone: "+212600000002",
      recommendedGroupId: "B",
      coverImageUrl: COVER.trackNight,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
    {
      id: "demo_sess_past_marina",
      title: "Footing Marina Juice (passée)",
      spot: "Marina Juice, Casablanca",
      dayOffset: 0,
      pastDaysAgo: 8,
      timeMinutes: 18 * 60,
      typeLabel: "FOOTING",
      volume: "8 km · cool",
      targetPace: "6:00–7:00/km",
      estimatedDistanceKm: 8,
      visibility: "public",
      withPaceGroups: false,
      coachName: H.abdelali,
      coachPhone: "+212600000001",
      recommendedGroupId: "D",
      coverImageUrl: COVER.waterfront,
      openRunners: 9,
      clubId: DEMO_CLUB_ID,
      hostGroupName: DEMO_CLUB_NAME,
    },
  ];


  let day0PastIndex = 0;
  return specs.map((spec) => {
    const day = new Date(startOfToday.getTime() + spec.dayOffset * DAY_MS);
    let timeMinutes = spec.timeMinutes;
    if (spec.pastDaysAgo != null) {
      day.setDate(day.getDate() - spec.pastDaysAgo);
    } else if (spec.dayOffset === 0) {
      // Keep Accueil "Aujourd'hui" filled: snap past tonight slots forward, staggered.
      const sessionMs = day.getTime() + timeMinutes * 60 * 1000;
      if (sessionMs <= now.getTime()) {
        const soon =
          now.getHours() * 60 + now.getMinutes() + 40 + day0PastIndex * 25;
        day0PastIndex += 1;
        if (soon <= 23 * 60 + 30) {
          timeMinutes = soon;
        } else {
          day.setDate(day.getDate() + 1);
        }
      }
    }
    const dateISO = isoDate(day);
    const paceGroups = spec.withPaceGroups
      ? PACE_GROUPS_ABCD.map((g) => ({ ...g }))
      : spec.openRunners && spec.openRunners > 0
        ? [
            {
              id: "open",
              label: "Ouvert",
              paceRange: spec.targetPace || "—",
              runnersCount: spec.openRunners,
              avgPaceSecondsPerKm: 330,
            },
          ]
        : [];

    // Invariant (a): members ⇒ clubId; public keeps club branding via hostGroupName
    const clubId =
      spec.visibility === "members"
        ? (spec.clubId ?? DEMO_CLUB_ID)
        : (spec.clubId ?? null);

    return {
      id: spec.id,
      title: spec.title,
      spot: spec.spot,
      dateLabel: formatDateLabel(day, timeMinutes),
      dateISO,
      timeMinutes,
      typeLabel: spec.typeLabel,
      volume: spec.volume,
      targetPace: spec.targetPace,
      estimatedDistanceKm: spec.estimatedDistanceKm,
      recommendedGroupId: spec.recommendedGroupId,
      clubId,
      visibility: spec.visibility,
      genderRestriction: spec.genderRestriction ?? "none",
      hostUserId: demoHostUserIdForName(spec.coachName),
      workoutId: null,
      // Club/demo outings are joinable community sessions, not user-owned drafts
      isCustom: false,
      createdAt: new Date().toISOString(),
      paceGroups,
      hostGroupName: spec.hostGroupName?.trim() || null,
      meetingPoint: spec.spot,
      coachAdvice:
        spec.purpose ??
        "Arrive 10 min avant. Hydrate-toi. On part ensemble.",
      coachPhone: spec.coachPhone,
      coachName: spec.coachName,
      coverImageUrl: spec.coverImageUrl ?? null,
      attendanceStatus: null,
      attendanceGroupId: null,
      feeMad: spec.feeMad ?? null,
      paymentStrict: spec.paymentStrict ?? null,
      ribAlias: spec.ribAlias ?? null,
      transferRefPrefix: spec.transferRefPrefix ?? null,
      requiresClubCotisation: spec.requiresClubCotisation ?? null,
    } satisfies ApiSession;
  });
}

function buildDemoAttendances(sessions: ApiSession[]): MockAttendance[] {
  const runners = DEMO_PEOPLE.filter((p) => p.role === "member");
  const rows: MockAttendance[] = [];

  sessions.forEach((session, sessionIndex) => {
    const hasGroups = (session.paceGroups?.length ?? 0) > 0;
    // Rotate which runners join so each session looks populated
    const sliceStart = sessionIndex % Math.max(1, runners.length - 8);
    const joinedRunners = runners
      .filter((r) => r.userId !== session.hostUserId)
      .slice(sliceStart, sliceStart + 8);
    const host =
      DEMO_PEOPLE.find((p) => p.userId === session.hostUserId) ??
      DEMO_COACH_PRIMARY;

    rows.push({
      id: `att_${session.id}_${host.userId}`,
      sessionId: session.id,
      userId: host.userId,
      displayName: host.displayName,
      groupId: hasGroups ? groupForPace(host.paceSecondsPerKm) : null,
      status: "joined",
    });

    joinedRunners.forEach((runner) => {
      rows.push({
        id: `att_${session.id}_${runner.userId}`,
        sessionId: session.id,
        userId: runner.userId,
        displayName: runner.displayName,
        groupId: hasGroups ? groupForPace(runner.paceSecondsPerKm) : null,
        status: "joined",
      });
    });
  });

  return rows;
}

function applyRunnerCounts(
  sessions: ApiSession[],
  attendance: MockAttendance[],
): ApiSession[] {
  return sessions.map((session) => {
    const joined = attendance.filter(
      (a) => a.sessionId === session.id && a.status === "joined",
    );
    if (!session.paceGroups?.length) {
      return session;
    }
    const paceGroups = session.paceGroups.map((g) => ({
      ...g,
      runnersCount: joined.filter((a) => a.groupId === g.id).length,
    }));
    return { ...session, paceGroups };
  });
}

async function seedDemoClubAdminSettings(): Promise<void> {
  const runGroups = [
    {
      id: "g_casa_rouge",
      name: "Rouge — rapide",
      colorKey: "red" as const,
      sortOrder: 0,
      active: true,
      note: "Sub 4:45",
    },
    {
      id: "g_casa_bleu",
      name: "Bleu",
      colorKey: "blue" as const,
      sortOrder: 1,
      active: true,
      note: "4:45–5:30",
    },
    {
      id: "g_casa_vert",
      name: "Vert — confort",
      colorKey: "green" as const,
      sortOrder: 2,
      active: true,
      note: "5:30–6:30",
    },
    {
      id: "g_casa_gris",
      name: "Gris — ouvert",
      colorKey: "grey" as const,
      sortOrder: 3,
      active: true,
      note: "Sans chrono",
    },
  ];
  const groupIds = runGroups.map((g) => g.id);
  const memberGroups: Record<string, string> = {};
  DEMO_PEOPLE.forEach((p, i) => {
    memberGroups[p.userId] = groupIds[i % groupIds.length]!;
  });
  const runAdmin = {
    name: DEMO_CLUB_NAME,
    description: DEMO_CLUB_DESCRIPTION,
    visibility: "members" as const,
    accessCode: DEMO_CLUB_CODE,
    interGroupAccessEnabled: true,
    defaultInterGroupPolicy: "warn" as const,
    activityStructure: "run" as const,
    memberOrgEnabled: true,
    colorGroups: runGroups,
    memberGroups,
    groups: [
      {
        id: "A" as const,
        paceLabel: "Sub 4:45",
        active: true,
        displayName: "Groupe A",
        accessPolicy: "inherit" as const,
      },
      {
        id: "B" as const,
        paceLabel: "4:45–5:30",
        active: true,
        displayName: "Groupe B",
        accessPolicy: "inherit" as const,
      },
      {
        id: "C" as const,
        paceLabel: "5:30–6:30",
        active: true,
        displayName: "Groupe C",
        accessPolicy: "inherit" as const,
      },
      {
        id: "D" as const,
        paceLabel: "Ouvert",
        active: true,
        displayName: "Groupe D",
        accessPolicy: "free" as const,
      },
    ],
  };
  await AsyncStorage.setItem(
    `grpd_club_admin_v2_${DEMO_CLUB_ID}`,
    JSON.stringify(runAdmin),
  );
}

/** Seed j’aime courir only — coaches, runners, sessions. Idempotent via seed version. */
export async function ensureDemoWorld(): Promise<Club & { code: string }> {
  const seeded = await AsyncStorage.getItem(MOCK_DEMO_SEEDED_KEY);
  const clubsExisting = await readJson<MockClubMap>(MOCK_CLUBS_KEY, {});
  const existing = clubsExisting[DEMO_CLUB_ID];

  if (seeded === DEMO_SEED_VERSION && existing) {
    return existing;
  }

  const club: Club & { code: string } = {
    id: DEMO_CLUB_ID,
    name: DEMO_CLUB_NAME,
    slug: "jaime-courir",
    city: DEMO_CLUB_CITY,
    description: DEMO_CLUB_DESCRIPTION,
    visibility: "members",
    createdAt: "2024-01-15T00:00:00.000Z",
    createdById: DEMO_COACH_PRIMARY.userId,
    code: DEMO_CLUB_CODE,
  };
  // Full replace — drop diversity / walk / lang clubs from prior seeds
  const clubs: MockClubMap = { [club.id]: club };
  await writeJson(MOCK_CLUBS_KEY, clubs);

  const memberships: MockMembershipMap = {};
  for (const person of DEMO_PEOPLE) {
    const membershipId = `membership_${person.userId}`;
    memberships[membershipId] = {
      id: membershipId,
      clubId: DEMO_CLUB_ID,
      userId: person.userId,
      role: person.role === "coach" ? "coach" : "member",
      status: "approved",
      displayName: person.displayName,
      avatarUrl: person.avatarUrl ?? null,
      sharePrs: true,
      prSummary: makePrSummary(person.paceSecondsPerKm),
      createdAt: "2024-02-01T00:00:00.000Z",
    };
  }
  await writeJson(MOCK_MEMBERSHIPS_KEY, memberships);

  const sessions = buildDemoSessions();
  const attendance = buildDemoAttendances(sessions);
  const sessionsWithCounts = applyRunnerCounts(sessions, attendance);

  const sessionMap: MockSessionMap = {};
  for (const s of sessionsWithCounts) {
    if (s.visibility === "members" && !s.clubId) {
      s.clubId = DEMO_CLUB_ID;
    }
    sessionMap[s.id] = s;
  }
  const attendanceMap: MockAttendanceMap = {};
  for (const a of attendance) {
    attendanceMap[a.id] = a;
  }
  await writeJson(MOCK_SESSIONS_KEY, sessionMap);
  await writeJson(MOCK_ATTENDANCE_KEY, attendanceMap);
  await seedDemoClubAdminSettings();
  // Drop admin caches for clubs removed in v12
  const staleAdmin = [
    DEMO_WALK_CLUB_ID,
    DEMO_LANG_CLUB_ID,
    "club_walk_rencontres",
    "club_english_walk",
    "club_founders_move",
    "club_corporate_girls",
    "club_eco_walk",
    "club_conseil_marche",
    "club_casa_running",
  ];
  await AsyncStorage.multiRemove(
    staleAdmin.map((id) => `grpd_club_admin_v2_${id}`),
  );
  await AsyncStorage.setItem(MOCK_DEMO_SEEDED_KEY, DEMO_SEED_VERSION);

  return club;
}


export async function readDemoSessions(): Promise<ApiSession[]> {
  // Seed when empty (covers one-tap mock entry without EXPO_PUBLIC_DEMO_MODE).
  // ensureDemoWorld is version-gated so user-created mock sessions survive.
  const existing = await readJson<MockSessionMap>(MOCK_SESSIONS_KEY, {});
  if (DEMO_MODE || Object.keys(existing).length === 0) {
    await ensureDemoWorld();
  }
  const map = await readJson<MockSessionMap>(MOCK_SESSIONS_KEY, {});
  return Object.values(map).sort((a, b) => {
    const da = `${a.dateISO ?? ""}-${String(a.timeMinutes ?? 0).padStart(4, "0")}`;
    const db = `${b.dateISO ?? ""}-${String(b.timeMinutes ?? 0).padStart(4, "0")}`;
    return da.localeCompare(db);
  });
}

export async function readDemoSession(
  sessionId: string,
): Promise<ApiSession | null> {
  const existing = await readJson<MockSessionMap>(MOCK_SESSIONS_KEY, {});
  if (DEMO_MODE || Object.keys(existing).length === 0) {
    await ensureDemoWorld();
  }
  const map = await readJson<MockSessionMap>(MOCK_SESSIONS_KEY, {});
  return map[sessionId] ?? null;
}

export async function writeDemoSession(session: ApiSession): Promise<void> {
  const map = await readJson<MockSessionMap>(MOCK_SESSIONS_KEY, {});
  if (session.visibility === "members" && !session.clubId) {
    throw new Error("members ⇒ clubId required");
  }
  map[session.id] = session;
  await writeJson(MOCK_SESSIONS_KEY, map);
}

export async function readAttendanceForSession(
  sessionId: string,
): Promise<MockAttendance[]> {
  if (DEMO_MODE) await ensureDemoWorld();
  const map = await readJson<MockAttendanceMap>(MOCK_ATTENDANCE_KEY, {});
  return Object.values(map).filter((a) => a.sessionId === sessionId);
}

export async function upsertAttendance(
  row: MockAttendance,
): Promise<MockAttendance> {
  const map = await readJson<MockAttendanceMap>(MOCK_ATTENDANCE_KEY, {});
  map[row.id] = row;
  await writeJson(MOCK_ATTENDANCE_KEY, map);

  // Refresh pace group counts on the session
  const sessions = await readJson<MockSessionMap>(MOCK_SESSIONS_KEY, {});
  const session = sessions[row.sessionId];
  if (session?.paceGroups?.length) {
    const all = Object.values(map).filter(
      (a) => a.sessionId === row.sessionId && a.status === "joined",
    );
    session.paceGroups = session.paceGroups.map((g) => ({
      ...g,
      runnersCount: all.filter((a) => a.groupId === g.id).length,
    }));
    sessions[session.id] = session;
    await writeJson(MOCK_SESSIONS_KEY, sessions);
  }
  return row;
}

export function buildParticipantsResult(
  session: ApiSession,
  attendance: MockAttendance[],
): SessionParticipantsResult {
  const participants: SessionParticipant[] = attendance.map((a) => ({
    userId: a.userId,
    displayName: a.displayName,
    groupId: a.groupId,
    status: a.status,
  }));

  const counts = {
    total: participants.length,
    joined: participants.filter((p) => p.status === "joined").length,
    suggested: participants.filter((p) => p.status === "suggested").length,
    requested: participants.filter((p) => p.status === "requested").length,
  };

  type GroupId = "A" | "B" | "C" | "D" | null;
  const groupOrder: GroupId[] = ["A", "B", "C", "D", null];
  const buckets: Record<string, SessionParticipant[]> = {
    A: [],
    B: [],
    C: [],
    D: [],
    null: [],
  };
  for (const p of participants) {
    buckets[p.groupId ?? "null"].push(p);
  }
  for (const arr of Object.values(buckets)) {
    arr.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  return {
    sessionId: session.id,
    visibility: session.visibility,
    clubId: session.clubId,
    counts,
    groups: groupOrder.map((groupId) => ({
      groupId,
      count: buckets[groupId ?? "null"].length,
      participants: buckets[groupId ?? "null"],
    })),
  };
}

/**
 * Attach the logged-in demo user to Casa Running as an approved coach
 * so Paramètres du club / admin surfaces are reachable in demo.
 * Still a plain member of the walk club (multi-club hub).
 */
export async function ensureDemoUserMembership(
  user: AuthUser,
  displayName?: string,
): Promise<void> {
  await ensureDemoWorld();
  const memberships = await readJson<MockMembershipMap>(
    MOCK_MEMBERSHIPS_KEY,
    {},
  );
  // Drop leftover memberships for removed clubs (walk / lang / diversity)
  for (const key of Object.keys(memberships)) {
    const m = memberships[key]!;
    if (m.clubId !== DEMO_CLUB_ID && m.userId === user.id) {
      delete memberships[key];
    }
  }
  const existing = Object.values(memberships).find(
    (m) => m.userId === user.id && m.clubId === DEMO_CLUB_ID,
  );
  if (existing) {
    existing.status = "approved";
    existing.role = "coach";
    if (displayName) existing.displayName = displayName;
    memberships[existing.id] = existing;
  } else {
    const id = `membership_${user.id}`;
    memberships[id] = {
      id,
      clubId: DEMO_CLUB_ID,
      userId: user.id,
      role: "coach",
      status: "approved",
      displayName: displayName ?? null,
      sharePrs: true,
      prSummary: makePrSummary(360),
      createdAt: new Date().toISOString(),
    };
  }
  await writeJson(MOCK_MEMBERSHIPS_KEY, memberships);

  // Pre-join lived-in outings (skip paid_* + cotisation outing for jury payment flows)
  const joinSessionIds = [
    "demo_sess_footing_rodriguez",
    "demo_sess_marche_marina_soir",
    "demo_sess_corniche_night",
    "demo_sess_marina_juice",
    "demo_sess_velodrome_series",
    "demo_sess_marche_ligue",
    "demo_sess_soir_members",
    "demo_sess_footing_sunset",
    "demo_sess_anfa_run",
    "demo_sess_past_footing",
    "demo_sess_past_velodrome",
    "demo_sess_past_marina",
  ];
  const attendance = await readJson<MockAttendanceMap>(MOCK_ATTENDANCE_KEY, {});
  for (const sessionId of joinSessionIds) {
    const attId = `att_${sessionId}_${user.id}`;
    attendance[attId] = {
      id: attId,
      sessionId,
      userId: user.id,
      displayName: displayName ?? user.phone ?? "Toi",
      groupId: "C",
      status: "joined",
    };
  }
  await writeJson(MOCK_ATTENDANCE_KEY, attendance);

  try {
    const joinedKey = `joinedSessions:v1:${user.id}`;
    const existingJoined = await AsyncStorage.getItem(joinedKey);
    const list: { sessionId: string; groupId: string }[] = existingJoined
      ? JSON.parse(existingJoined)
      : [];
    const asArray = Array.isArray(list) ? list : [];
    for (const sessionId of joinSessionIds) {
      if (!asArray.some((j) => j.sessionId === sessionId)) {
        asArray.push({ sessionId, groupId: "C" });
      }
    }
    await AsyncStorage.setItem(joinedKey, JSON.stringify(asArray));
  } catch {
    /* ignore */
  }

  try {
    const raw = await AsyncStorage.getItem(`grpd_club_admin_v2_${DEMO_CLUB_ID}`);
    if (raw) {
      const admin = JSON.parse(raw) as {
        memberGroups?: Record<string, string>;
      };
      admin.memberGroups = {
        ...(admin.memberGroups ?? {}),
        [user.id]: "g_casa_vert",
      };
      await AsyncStorage.setItem(
        `grpd_club_admin_v2_${DEMO_CLUB_ID}`,
        JSON.stringify(admin),
      );
    }
  } catch {
    /* ignore */
  }
}


const DEMO_RESET_KEYS = [
  MOCK_OTP_KEY,
  MOCK_USERS_KEY,
  MOCK_PINS_KEY,
  MOCK_CLUBS_KEY,
  MOCK_MEMBERSHIPS_KEY,
  MOCK_SESSIONS_KEY,
  MOCK_ATTENDANCE_KEY,
  MOCK_DEMO_SEEDED_KEY,
  "grpd_auth_tokens_v1",
  "grpd_auth_user_v1",
  "grpd_use_mock_api_v1",
  "grpd_login_phone_v1",
  "grpd_login_otp_request_v1",
  "grpd_onboarding_v1",
  "grpd_profile_v1",
  "grpd_reference_paces_v1",
  "grpd_tests_v1",
  "grpd_test_records_v2",
  "sessions:v1",
  "joinedSessions:v1",
  // Per-user joined session keys are cleared via prefix scan in resetDemoWorld when present.
  "runs:v1",
  "grpd_coach_feedback_v1",
  "grpd_settings_prefs_v1",
  "spots:v1",
  "spots:v2",
  `grpd_club_admin_v2_${DEMO_WALK_CLUB_ID}`,
  `grpd_club_admin_v2_${DEMO_LANG_CLUB_ID}`,
  "grpd_club_admin_v2_club_casa_running",
  "grpd_club_admin_v2_club_walk_rencontres",
  "grpd_club_admin_v2_club_english_walk",
  "grpd_club_admin_v2_club_founders_move",
  "grpd_club_admin_v2_club_corporate_girls",
  "grpd_club_admin_v2_club_eco_walk",
  "grpd_club_admin_v2_club_conseil_marche",
];

// Payment / cotisation keys cleared via prefix in resetDemoData.

/** Clear AsyncStorage demo state and reseed the Casablanca world. */
export async function resetDemoData(): Promise<void> {
  if (!DEMO_MODE) {
    // Still allow reset when called from settings if flag flips mid-session
  }
  const allKeys = await AsyncStorage.getAllKeys();
  const joinedUserKeys = allKeys.filter((k) =>
    k.startsWith("joinedSessions:v1"),
  );
  const paymentKeys = allKeys.filter(
    (k) =>
      k.startsWith("grpd_session_payment_v1:") ||
      k.startsWith("grpd_club_cotisation_v1:"),
  );
  await AsyncStorage.multiRemove([
    ...DEMO_RESET_KEYS,
    ...joinedUserKeys,
    ...paymentKeys,
  ]);
  await ensureDemoWorld();
}

/**
 * Force a fresh Casablanca world + attach the logged-in tester so every tab
 * (Accueil, Mes Sorties, Clubs, Profil) shows real fixture data.
 */
export async function hydrateDemoTesterData(
  user: AuthUser,
  displayName?: string,
): Promise<void> {
  // Drop seed marker so dates/outings rebuild relative to "today".
  await AsyncStorage.removeItem(MOCK_DEMO_SEEDED_KEY);
  await ensureDemoWorld();
  await ensureDemoUserMembership(user, displayName);

  try {
    const {
      saveReferencePaces,
      saveTestRecord,
      getRunnerProfile,
      saveRunnerProfile,
    } = await import("../profileStore");
    const name = displayName?.trim() || user.name?.trim() || "Nouamane Ajana";
    const existing = await getRunnerProfile();
    await saveRunnerProfile({
      name,
      firstName: name,
      vo2max: existing?.vo2max ?? 48,
      weightKg: existing?.weightKg ?? 72,
      mainGoal: existing?.mainGoal ?? "10k",
      clubName: DEMO_CLUB_NAME,
      gender: existing?.gender ?? "male",
      targetRaceType: "10k",
      targetSessionsPerWeek: 3,
      targetKmPerWeek: 25,
    });
    await saveReferencePaces({
      easyMin: 330,
      easyMax: 390,
      tempoMin: 285,
      tempoMax: 315,
      thresholdMin: 255,
      thresholdMax: 275,
      intervalsMin: 225,
      intervalsMax: 245,
    });
    const now = Date.now();
    const prs = [
      {
        id: `demo_pr_5k_${user.id}`,
        kind: "distance" as const,
        label: "5 km",
        mode: "time_over_distance" as const,
        distanceMeters: 5000,
        durationSeconds: 22 * 60 + 40,
        paceSecondsPerKm: 272,
        testDate: "2025-10-12",
        testType: "official" as const,
        createdAt: now - 40 * DAY_MS,
      },
      {
        id: `demo_pr_10k_${user.id}`,
        kind: "distance" as const,
        label: "10 km",
        mode: "time_over_distance" as const,
        distanceMeters: 10000,
        durationSeconds: 48 * 60 + 10,
        paceSecondsPerKm: 289,
        testDate: "2025-09-20",
        testType: "official" as const,
        createdAt: now - 60 * DAY_MS,
      },
      {
        id: `demo_pr_1k_${user.id}`,
        kind: "distance" as const,
        label: "1 km",
        mode: "time_over_distance" as const,
        distanceMeters: 1000,
        durationSeconds: 3 * 60 + 55,
        paceSecondsPerKm: 235,
        testDate: "2025-11-01",
        testType: "training" as const,
        createdAt: now - 14 * DAY_MS,
      },
      {
        id: `demo_pr_1min_${user.id}`,
        kind: "duration" as const,
        label: "1 minute",
        mode: "distance_over_time" as const,
        distanceMeters: 280,
        durationSeconds: 60,
        paceSecondsPerKm: 214,
        testDate: "2025-11-05",
        testType: "solo" as const,
        createdAt: now - 10 * DAY_MS,
      },
    ];
    for (const pr of prs) {
      await saveTestRecord(pr);
    }
  } catch (error) {
    console.warn("hydrateDemoTesterData profile extras failed:", error);
  }
}
