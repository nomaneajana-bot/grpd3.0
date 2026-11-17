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

export const MOCK_SESSIONS_KEY = "mock:sessions";
export const MOCK_ATTENDANCE_KEY = "mock:attendance";
export const MOCK_USERS_KEY = "mock:users";
export const MOCK_PINS_KEY = "mock:pins";
export const MOCK_CLUBS_KEY = "mock:clubs";
export const MOCK_MEMBERSHIPS_KEY = "mock:club_memberships";
export const MOCK_OTP_KEY = "mock:otp";
/** Bump to force a one-time reseed of the richer Casablanca world. */
export const MOCK_DEMO_SEEDED_KEY = "mock:demo_seeded_v4";
export const DEMO_SEED_VERSION = "4";

export const DEMO_CLUB_ID = "club_casa_running";
export const DEMO_CLUB_NAME = "Casa Running Club";
export const DEMO_CLUB_CODE = "CASA2026";
export const DEMO_CLUB_CITY = "Casablanca";
export const DEMO_CLUB_DESCRIPTION =
  "Club de course à pied — Ain Diab & Corniche. Sorties structurées et allures pour tous les niveaux.";

export const DEMO_WALK_CLUB_ID = "club_casa_marche";
export const DEMO_WALK_CLUB_NAME = "Casa Marche Douce";
export const DEMO_WALK_CLUB_CODE = "MARCHE26";

export const DEMO_LANG_CLUB_ID = "club_french_run_talk";
export const DEMO_LANG_CLUB_NAME = "French Run & Talk";
export const DEMO_LANG_CLUB_CODE = "FRTALK26";

type DemoPerson = {
  userId: string;
  displayName: string;
  role: "coach" | "member";
  paceSecondsPerKm: number;
};

/** 2 coaches + 12 runners — French names. */
export const DEMO_PEOPLE: DemoPerson[] = [
  {
    userId: "demo_coach_youssef",
    displayName: "Youssef Benali",
    role: "coach",
    paceSecondsPerKm: 270,
  },
  {
    userId: "demo_coach_amelie",
    displayName: "Amélie Traoré",
    role: "coach",
    paceSecondsPerKm: 300,
  },
  {
    userId: "demo_runner_camille",
    displayName: "Camille Dupont",
    role: "member",
    paceSecondsPerKm: 255,
  },
  {
    userId: "demo_runner_lucas",
    displayName: "Lucas Martin",
    role: "member",
    paceSecondsPerKm: 268,
  },
  {
    userId: "demo_runner_chloe",
    displayName: "Chloé Bernard",
    role: "member",
    paceSecondsPerKm: 285,
  },
  {
    userId: "demo_runner_hugo",
    displayName: "Hugo Lefèvre",
    role: "member",
    paceSecondsPerKm: 295,
  },
  {
    userId: "demo_runner_lea",
    displayName: "Léa Moreau",
    role: "member",
    paceSecondsPerKm: 310,
  },
  {
    userId: "demo_runner_nathan",
    displayName: "Nathan Petit",
    role: "member",
    paceSecondsPerKm: 325,
  },
  {
    userId: "demo_runner_manon",
    displayName: "Manon Roux",
    role: "member",
    paceSecondsPerKm: 340,
  },
  {
    userId: "demo_runner_louis",
    displayName: "Louis Girard",
    role: "member",
    paceSecondsPerKm: 355,
  },
  {
    userId: "demo_runner_emma",
    displayName: "Emma Fontaine",
    role: "member",
    paceSecondsPerKm: 370,
  },
  {
    userId: "demo_runner_arthur",
    displayName: "Arthur Blanc",
    role: "member",
    paceSecondsPerKm: 390,
  },
  {
    userId: "demo_runner_jade",
    displayName: "Jade Mercier",
    role: "member",
    paceSecondsPerKm: 410,
  },
  {
    userId: "demo_runner_theo",
    displayName: "Théo Renard",
    role: "member",
    paceSecondsPerKm: 430,
  },
];

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
  };

  const specs: SpecExtra[] = [
    {
      id: "demo_sess_footing_corniche",
      title: "Footing Corniche",
      spot: "Corniche Ain Diab",
      dayOffset: 0,
      timeMinutes: 19 * 60,
      typeLabel: "FOOTING",
      volume: "45 min · allure facile",
      targetPace: "5:30–6:30/km",
      estimatedDistanceKm: 8,
      visibility: "public",
      withPaceGroups: true,
      coachName: "Youssef Benali",
      coachPhone: "+212600000001",
      recommendedGroupId: "C",
      purpose: "Se mettre en jambes sans se forcer — on discute un peu.",
    },
    {
      id: "demo_sess_fartlek_ain_diab",
      title: "Fartlek Ain Diab",
      spot: "Ain Diab — Phare El Hank",
      dayOffset: 1,
      timeMinutes: 18 * 60 + 30,
      typeLabel: "FARTLEK",
      volume: "8 km · jeux d'allure",
      targetPace: "4:45–5:45/km",
      estimatedDistanceKm: 8,
      visibility: "members",
      withPaceGroups: true,
      coachName: "Amélie Traoré",
      coachPhone: "+212600000002",
      recommendedGroupId: "B",
      clubId: DEMO_CLUB_ID,
      purpose: "Variations d’allure sur le front de mer.",
    },
    {
      id: "demo_sess_series_piste",
      title: "Séries piste",
      spot: "Piste Mohammed V",
      dayOffset: 2,
      timeMinutes: 7 * 60,
      typeLabel: "SERIES",
      volume: "10×400 m · récup 90s",
      targetPace: "4:00–5:00/km",
      estimatedDistanceKm: 6,
      visibility: "members",
      withPaceGroups: true,
      coachName: "Youssef Benali",
      coachPhone: "+212600000001",
      recommendedGroupId: "A",
      clubId: DEMO_CLUB_ID,
      purpose: "Travail de vitesse — groupes A–D.",
    },
    {
      id: "demo_sess_footing_sunset",
      title: "Footing coucher de soleil",
      spot: "Corniche — Café Maure",
      dayOffset: 3,
      timeMinutes: 18 * 60,
      typeLabel: "FOOTING",
      volume: "50 min · conversation",
      targetPace: "6:00–7:00/km",
      estimatedDistanceKm: 7,
      visibility: "public",
      withPaceGroups: false,
      coachName: "Amélie Traoré",
      coachPhone: "+212600000002",
      recommendedGroupId: "D",
      purpose: "Fin de journée, rythme conversation.",
      openRunners: 9,
    },
    {
      id: "demo_sess_reprise_femmes",
      title: "Reprise 100% femmes",
      spot: "Corniche El Hank",
      dayOffset: 1,
      timeMinutes: 19 * 60,
      typeLabel: "FOOTING",
      volume: "45 min · allure facile",
      targetPace: "5:30–6:30/km",
      estimatedDistanceKm: 8,
      visibility: "public",
      withPaceGroups: true,
      coachName: "Amélie Traoré",
      coachPhone: "+212600000002",
      recommendedGroupId: "C",
      purpose: "Reprise douce, uniquement entre femmes — ambiance bienveillante.",
      genderRestriction: "women_only",
    },
    {
      id: "demo_sess_marche_parc",
      title: "Marche au Parc de la Ligue Arabe",
      spot: "Parc de la Ligue Arabe",
      dayOffset: 1,
      timeMinutes: 10 * 60,
      typeLabel: "MARCHE",
      volume: "60 min · pas pressé",
      targetPace: "—",
      estimatedDistanceKm: 4,
      visibility: "members",
      withPaceGroups: false,
      coachName: "Amélie Traoré",
      coachPhone: "+212600000002",
      recommendedGroupId: "D",
      clubId: DEMO_WALK_CLUB_ID,
      purpose: "Marcher ensemble, se rencontrer — sans chrono.",
    },
    {
      id: "demo_sess_marche_corniche",
      title: "Marche Corniche du dimanche",
      spot: "Corniche Ain Diab",
      dayOffset: 4,
      timeMinutes: 9 * 60 + 30,
      typeLabel: "MARCHE",
      volume: "75 min · café après",
      targetPace: "—",
      estimatedDistanceKm: 5,
      visibility: "public",
      withPaceGroups: false,
      coachName: "Amélie Traoré",
      coachPhone: "+212600000002",
      recommendedGroupId: "D",
      purpose: "Ouverte à tous — rythme marche.",
      openRunners: 11,
    },
    {
      id: "demo_sess_french_run_talk",
      title: "French Run & Talk — débutants",
      spot: "Jardin de l’École de l’Air",
      dayOffset: 2,
      timeMinutes: 18 * 60,
      typeLabel: "LANGUE",
      volume: "40 min · pauses parlées",
      targetPace: "6:30–7:30/km",
      estimatedDistanceKm: 5,
      visibility: "members",
      withPaceGroups: false,
      coachName: "Youssef Benali",
      coachPhone: "+212600000001",
      recommendedGroupId: "D",
      clubId: DEMO_LANG_CLUB_ID,
      purpose: "Courir doucement et parler français.",
    },
    {
      id: "demo_sess_fartlek_public",
      title: "Fartlek public Marina",
      spot: "Marina Casablanca",
      dayOffset: 5,
      timeMinutes: 19 * 60 + 15,
      typeLabel: "FARTLEK",
      volume: "6 km · pyramides",
      targetPace: "5:00–6:00/km",
      estimatedDistanceKm: 6,
      visibility: "public",
      withPaceGroups: false,
      coachName: "Youssef Benali",
      coachPhone: "+212600000001",
      recommendedGroupId: "C",
      purpose: "Ouvert Découvrir — allure progressive.",
      openRunners: 7,
    },
    {
      id: "demo_sess_series_members",
      title: "Séries membres — Corniche",
      spot: "Corniche Ain Diab",
      dayOffset: 6,
      timeMinutes: 7 * 60 + 30,
      typeLabel: "SERIES",
      volume: "6×800 m · récup 2 min",
      targetPace: "4:30–5:30/km",
      estimatedDistanceKm: 9,
      visibility: "members",
      withPaceGroups: false,
      coachName: "Amélie Traoré",
      coachPhone: "+212600000002",
      recommendedGroupId: "B",
      clubId: DEMO_CLUB_ID,
    },
    {
      id: "demo_sess_long_weekend",
      title: "Sortie longue week-end",
      spot: "Anfa — Twin Center",
      dayOffset: 7,
      timeMinutes: 8 * 60,
      typeLabel: "LONG",
      volume: "14 km · endurance",
      targetPace: "5:20–6:20/km",
      estimatedDistanceKm: 14,
      visibility: "members",
      withPaceGroups: true,
      coachName: "Youssef Benali",
      coachPhone: "+212600000001",
      recommendedGroupId: "C",
      clubId: DEMO_CLUB_ID,
      purpose: "Endurance fondamentale — groupes selon allure.",
    },
    {
      id: "demo_sess_past_footing",
      title: "Footing Parc Yasmina",
      spot: "Parc Yasmina",
      dayOffset: 0,
      pastDaysAgo: 3,
      timeMinutes: 18 * 60,
      typeLabel: "FOOTING",
      volume: "40 min",
      targetPace: "5:45–6:45/km",
      estimatedDistanceKm: 7,
      visibility: "public",
      withPaceGroups: false,
      coachName: "Amélie Traoré",
      coachPhone: "+212600000002",
      recommendedGroupId: "D",
      purpose: "Allure conversation autour du parc.",
    },
    {
      id: "demo_sess_past_marche",
      title: "Marche douce Ain Diab",
      spot: "Corniche Ain Diab",
      dayOffset: 0,
      pastDaysAgo: 6,
      timeMinutes: 10 * 60,
      typeLabel: "MARCHE",
      volume: "60 min · pas pressé",
      targetPace: "—",
      estimatedDistanceKm: 5,
      visibility: "public",
      withPaceGroups: false,
      coachName: "Amélie Traoré",
      coachPhone: "+212600000002",
      recommendedGroupId: "D",
      purpose: "Marche ensemble, sans chrono — café après.",
    },
    {
      id: "demo_sess_past_long",
      title: "Sortie longue Anfa",
      spot: "Anfa — Twin Center",
      dayOffset: 0,
      pastDaysAgo: 10,
      timeMinutes: 8 * 60,
      typeLabel: "LONG",
      volume: "14 km · endurance",
      targetPace: "5:20–6:20/km",
      estimatedDistanceKm: 14,
      visibility: "members",
      withPaceGroups: true,
      coachName: "Youssef Benali",
      coachPhone: "+212600000001",
      recommendedGroupId: "C",
      clubId: DEMO_CLUB_ID,
      purpose: "Endurance fondamentale — groupes selon allure.",
    },
    {
      id: "demo_sess_past_sunset",
      title: "Footing coucher de soleil",
      spot: "Corniche — Café Maure",
      dayOffset: 0,
      pastDaysAgo: 14,
      timeMinutes: 18 * 60 + 30,
      typeLabel: "FOOTING",
      volume: "50 min · conversation",
      targetPace: "6:00–7:00/km",
      estimatedDistanceKm: 8,
      visibility: "public",
      withPaceGroups: false,
      coachName: "Youssef Benali",
      coachPhone: "+212600000001",
      recommendedGroupId: "C",
      purpose: "Fin de journée sur la corniche.",
    },
  ];

  return specs.map((spec) => {
    const day = new Date(startOfToday.getTime() + spec.dayOffset * DAY_MS);
    if (spec.pastDaysAgo != null) {
      day.setDate(day.getDate() - spec.pastDaysAgo);
    } else if (spec.dayOffset === 0) {
      // If today's evening session already passed, push +7d for dayOffset 0
      const sessionMs = day.getTime() + spec.timeMinutes * 60 * 1000;
      if (sessionMs <= now.getTime()) {
        day.setDate(day.getDate() + 7);
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

    // Invariant (a): members ⇒ clubId; public must not inherit club context
    const clubId =
      spec.visibility === "members"
        ? (spec.clubId ?? DEMO_CLUB_ID)
        : (spec.clubId ?? null);

    return {
      id: spec.id,
      title: spec.title,
      spot: spec.spot,
      dateLabel: formatDateLabel(day, spec.timeMinutes),
      dateISO,
      timeMinutes: spec.timeMinutes,
      typeLabel: spec.typeLabel,
      volume: spec.volume,
      targetPace: spec.targetPace,
      estimatedDistanceKm: spec.estimatedDistanceKm,
      recommendedGroupId: spec.recommendedGroupId,
      clubId,
      visibility: spec.visibility,
      genderRestriction: spec.genderRestriction ?? "none",
      hostUserId:
        spec.coachName === "Youssef Benali"
          ? "demo_coach_youssef"
          : "demo_coach_amelie",
      workoutId: null,
      // Club/demo outings are joinable community sessions, not user-owned drafts
      isCustom: false,
      createdAt: new Date().toISOString(),
      paceGroups,
      hostGroupName: null,
      meetingPoint: spec.spot,
      coachAdvice:
        spec.purpose ??
        "Arrive 10 min avant. Hydrate-toi. On part ensemble.",
      coachPhone: spec.coachPhone,
      coachName: spec.coachName,
      attendanceStatus: null,
      attendanceGroupId: null,
    } satisfies ApiSession;
  });
}

function buildDemoAttendances(sessions: ApiSession[]): MockAttendance[] {
  const runners = DEMO_PEOPLE.filter((p) => p.role === "member");
  const coaches = DEMO_PEOPLE.filter((p) => p.role === "coach");
  const rows: MockAttendance[] = [];

  sessions.forEach((session, sessionIndex) => {
    const hasGroups = (session.paceGroups?.length ?? 0) > 0;
    // Rotate which runners join so each session looks populated
    const sliceStart = sessionIndex % Math.max(1, runners.length - 5);
    const joinedRunners = runners.slice(sliceStart, sliceStart + 6);
    const hostCoach =
      coaches.find((c) => c.userId === session.hostUserId) ?? coaches[0];

    rows.push({
      id: `att_${session.id}_${hostCoach.userId}`,
      sessionId: session.id,
      userId: hostCoach.userId,
      displayName: hostCoach.displayName,
      groupId: hasGroups ? groupForPace(hostCoach.paceSecondsPerKm) : null,
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
  // Stable color-group ids so assignments survive reloads in the same seed.
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
  const memberGroups: Record<string, string> = {
    demo_coach_youssef: "g_casa_rouge",
    demo_coach_amelie: "g_casa_bleu",
    demo_runner_camille: "g_casa_rouge",
    demo_runner_lucas: "g_casa_rouge",
    demo_runner_chloe: "g_casa_bleu",
    demo_runner_hugo: "g_casa_bleu",
    demo_runner_lea: "g_casa_vert",
    demo_runner_nathan: "g_casa_vert",
    demo_runner_manon: "g_casa_vert",
    demo_runner_louis: "g_casa_gris",
    demo_runner_emma: "g_casa_gris",
  };
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

  const walkAdmin = {
    name: DEMO_WALK_CLUB_NAME,
    description: "Marches conviviales à Casablanca — sans chrono.",
    visibility: "members" as const,
    accessCode: DEMO_WALK_CLUB_CODE,
    interGroupAccessEnabled: true,
    defaultInterGroupPolicy: "free" as const,
    activityStructure: "walk" as const,
    memberOrgEnabled: true,
    colorGroups: [
      {
        id: "g_walk_conv",
        name: "Conversation",
        colorKey: "teal" as const,
        sortOrder: 0,
        active: true,
      },
      {
        id: "g_walk_bin",
        name: "Binômes",
        colorKey: "amber" as const,
        sortOrder: 1,
        active: true,
      },
      {
        id: "g_walk_open",
        name: "Ouvert",
        colorKey: "grey" as const,
        sortOrder: 2,
        active: true,
      },
    ],
    memberGroups: {
      demo_coach_amelie: "g_walk_conv",
      demo_runner_lea: "g_walk_conv",
      demo_runner_manon: "g_walk_bin",
      demo_runner_emma: "g_walk_open",
    },
    groups: [
      {
        id: "A" as const,
        paceLabel: "—",
        active: false,
        displayName: "Groupe A",
        accessPolicy: "inherit" as const,
      },
      {
        id: "B" as const,
        paceLabel: "—",
        active: false,
        displayName: "Groupe B",
        accessPolicy: "inherit" as const,
      },
      {
        id: "C" as const,
        paceLabel: "—",
        active: false,
        displayName: "Groupe C",
        accessPolicy: "inherit" as const,
      },
      {
        id: "D" as const,
        paceLabel: "—",
        active: false,
        displayName: "Groupe D",
        accessPolicy: "inherit" as const,
      },
    ],
  };
  await AsyncStorage.setItem(
    `grpd_club_admin_v2_${DEMO_WALK_CLUB_ID}`,
    JSON.stringify(walkAdmin),
  );

  const langAdmin = {
    name: DEMO_LANG_CLUB_NAME,
    description: "Courir doucement et parler français.",
    visibility: "members" as const,
    accessCode: DEMO_LANG_CLUB_CODE,
    interGroupAccessEnabled: true,
    defaultInterGroupPolicy: "free" as const,
    activityStructure: "neutral" as const,
    memberOrgEnabled: true,
    colorGroups: [
      {
        id: "g_fr_a1",
        name: "A1–A2",
        colorKey: "purple" as const,
        sortOrder: 0,
        active: true,
      },
      {
        id: "g_fr_b1",
        name: "B1–B2",
        colorKey: "blue" as const,
        sortOrder: 1,
        active: true,
      },
      {
        id: "g_fr_open",
        name: "Tous niveaux",
        colorKey: "grey" as const,
        sortOrder: 2,
        active: true,
      },
    ],
    memberGroups: {
      demo_coach_youssef: "g_fr_b1",
      demo_runner_camille: "g_fr_b1",
      demo_runner_lucas: "g_fr_a1",
    },
    groups: walkAdmin.groups,
  };
  await AsyncStorage.setItem(
    `grpd_club_admin_v2_${DEMO_LANG_CLUB_ID}`,
    JSON.stringify(langAdmin),
  );
}

/** Seed clubs, coaches, runners, sessions, and joined attendance. Idempotent. */
export async function ensureDemoWorld(): Promise<Club & { code: string }> {
  const seeded = await AsyncStorage.getItem(MOCK_DEMO_SEEDED_KEY);
  const clubs = await readJson<MockClubMap>(MOCK_CLUBS_KEY, {});
  const existing = clubs[DEMO_CLUB_ID];

  if (seeded === DEMO_SEED_VERSION && existing) {
    return existing;
  }

  const club: Club & { code: string } = {
    id: DEMO_CLUB_ID,
    name: DEMO_CLUB_NAME,
    slug: "casa-running-club",
    city: DEMO_CLUB_CITY,
    description: DEMO_CLUB_DESCRIPTION,
    visibility: "members",
    createdAt: "2024-01-15T00:00:00.000Z",
    createdById: "demo_coach_youssef",
    code: DEMO_CLUB_CODE,
  };
  const walkClub: Club & { code: string } = {
    id: DEMO_WALK_CLUB_ID,
    name: DEMO_WALK_CLUB_NAME,
    slug: "casa-marche-douce",
    city: DEMO_CLUB_CITY,
    description: "Marches conviviales — Corniche & parcs. Pas de chrono.",
    visibility: "members",
    createdAt: "2024-03-01T00:00:00.000Z",
    createdById: "demo_coach_amelie",
    code: DEMO_WALK_CLUB_CODE,
  };
  const langClub: Club & { code: string } = {
    id: DEMO_LANG_CLUB_ID,
    name: DEMO_LANG_CLUB_NAME,
    slug: "french-run-talk",
    city: DEMO_CLUB_CITY,
    description: "On court doucement. On parle français.",
    visibility: "members",
    createdAt: "2024-04-01T00:00:00.000Z",
    createdById: "demo_coach_youssef",
    code: DEMO_LANG_CLUB_CODE,
  };
  clubs[club.id] = club;
  clubs[walkClub.id] = walkClub;
  clubs[langClub.id] = langClub;
  await writeJson(MOCK_CLUBS_KEY, clubs);

  const memberships = await readJson<MockMembershipMap>(
    MOCK_MEMBERSHIPS_KEY,
    {},
  );
  for (const person of DEMO_PEOPLE) {
    const membershipId = `membership_${person.userId}`;
    memberships[membershipId] = {
      id: membershipId,
      clubId: DEMO_CLUB_ID,
      userId: person.userId,
      role: person.role === "coach" ? "coach" : "member",
      status: "approved",
      displayName: person.displayName,
      sharePrs: true,
      prSummary: makePrSummary(person.paceSecondsPerKm),
      createdAt: "2024-02-01T00:00:00.000Z",
    };
  }
  // Subset also in walk + language clubs
  for (const person of DEMO_PEOPLE.filter((p) =>
    [
      "demo_coach_amelie",
      "demo_runner_lea",
      "demo_runner_manon",
      "demo_runner_emma",
    ].includes(p.userId),
  )) {
    const id = `membership_walk_${person.userId}`;
    memberships[id] = {
      id,
      clubId: DEMO_WALK_CLUB_ID,
      userId: person.userId,
      role: person.role === "coach" ? "coach" : "member",
      status: "approved",
      displayName: person.displayName,
      sharePrs: false,
      prSummary: null,
      createdAt: "2024-03-10T00:00:00.000Z",
    };
  }
  for (const person of DEMO_PEOPLE.filter((p) =>
    [
      "demo_coach_youssef",
      "demo_runner_camille",
      "demo_runner_lucas",
      "demo_runner_chloe",
    ].includes(p.userId),
  )) {
    const id = `membership_lang_${person.userId}`;
    memberships[id] = {
      id,
      clubId: DEMO_LANG_CLUB_ID,
      userId: person.userId,
      role: person.role === "coach" ? "coach" : "member",
      status: "approved",
      displayName: person.displayName,
      sharePrs: true,
      prSummary: makePrSummary(person.paceSecondsPerKm),
      createdAt: "2024-04-10T00:00:00.000Z",
    };
  }
  await writeJson(MOCK_MEMBERSHIPS_KEY, memberships);

  const sessions = buildDemoSessions();
  const attendance = buildDemoAttendances(sessions);
  const sessionsWithCounts = applyRunnerCounts(sessions, attendance);

  const sessionMap: MockSessionMap = {};
  for (const s of sessionsWithCounts) {
    // Invariant (a) assert
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
  await AsyncStorage.setItem(MOCK_DEMO_SEEDED_KEY, DEMO_SEED_VERSION);

  return club;
}

export async function readDemoSessions(): Promise<ApiSession[]> {
  // Only seed the Casablanca world in DEMO_MODE. Explicit mock mode must keep
  // user-created sessions (club walks, etc.) without wiping mock:sessions.
  if (DEMO_MODE) await ensureDemoWorld();
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
  if (DEMO_MODE) await ensureDemoWorld();
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
  // Also member of walk club so Clubs hub feels multi-club when focusing
  const walkExisting = Object.values(memberships).find(
    (m) => m.userId === user.id && m.clubId === DEMO_WALK_CLUB_ID,
  );
  if (!walkExisting) {
    memberships[`membership_walk_${user.id}`] = {
      id: `membership_walk_${user.id}`,
      clubId: DEMO_WALK_CLUB_ID,
      userId: user.id,
      role: "member",
      status: "approved",
      displayName: displayName ?? null,
      sharePrs: false,
      prSummary: null,
      createdAt: new Date().toISOString(),
    };
  }
  await writeJson(MOCK_MEMBERSHIPS_KEY, memberships);

  // Pre-join a couple of outings so Accueil / Mes Sorties look lived-in
  const joinSessionIds = [
    "demo_sess_footing_corniche",
    "demo_sess_footing_sunset",
    "demo_sess_past_footing",
    "demo_sess_past_marche",
    "demo_sess_past_long",
    "demo_sess_past_sunset",
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

  // Place demo user in Casa Running “Vert — confort”
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
];

/** Clear AsyncStorage demo state and reseed the Casablanca world. */
export async function resetDemoData(): Promise<void> {
  if (!DEMO_MODE) {
    // Still allow reset when called from settings if flag flips mid-session
  }
  const allKeys = await AsyncStorage.getAllKeys();
  const joinedUserKeys = allKeys.filter((k) =>
    k.startsWith("joinedSessions:v1"),
  );
  await AsyncStorage.multiRemove([
    ...DEMO_RESET_KEYS,
    ...joinedUserKeys,
  ]);
  await ensureDemoWorld();
}
