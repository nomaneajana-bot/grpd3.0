/**
 * j’aime courir demo roster — names from J❤️COURIR Members screenshots.
 * No photo URLs: UI uses initials avatars.
 */

export type DemoPerson = {
  userId: string;
  displayName: string;
  role: "coach" | "member";
  paceSecondsPerKm: number;
  avatarUrl?: string;
};

/** Deduped member names (French-facing demo). */
export const DEMO_ROSTER_NAMES = [
  "Abdelali Rguig",
  "Ilham Samir",
  "Abdellatif Smahi",
  "Ghalia Smahi",
  "Walid Tagmout",
  "Hamza Tanazefti",
  "Said Tighadouini",
  "Chaimae Youssoufi",
  "Qouhafa Zakaria",
  "Hamza Zoutoune",
  "El Mehdi Nifkiren",
  "Mohamed Oubenaakka",
  "Ghizlane Rabhi",
  "Mohamed Adnan Rahoui",
  "Ines Rajiallah",
  "Sara Raoui",
  "Hamza Regui",
  "Mohammed Rgaguna",
  "Youness Machkour",
  "Anas Makhloufi",
  "Chafik Marmoucha",
  "Rajiallah Marwa",
  "Mohammed Maslouh",
  "Fatima Mechkouk",
  "Nahed Mouad",
  "Nafissa Mounir",
  "Laila Nasr",
  "Abdelilah Nejjam",
  "Omar Imahmoudene",
  "Nabil Jadri",
  "Ghita Jennaoui",
  "Safaa Jinane",
  "Fatma Kanoun",
  "Ouiam Kich",
  "Mohammed Amine Ktiri",
  "Rajaa Lachhab",
  "Hamza Ld",
  "Salaheddine Lemaizi",
  "Meriem Esseda",
  "Widad Farihi",
  "Ezzahra Fatima",
  "Ismail Fourari",
  "Rady Ghizlan",
  "Rahma Gouizet",
  "Laila Haba",
  "Abdelaziz Habib",
  "Dounia Hassoun",
  "Mohamed Naoufal Houssary",
  "Fatima Zahrae Chraa",
  "Llatifa Dahbi",
  "Walid Dahmane",
  "Faycal El Amradi",
  "Abderrahim El Hirech",
  "Meriem El Ibrahymy",
  "Nora El Jamal",
  "Houda El Mekkaoui",
  "Inssaf El Mrabet",
  "Sanae El Ouali",
] as const;

function slugPerson(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/** First two = coaches / hosts; rest = members. Initials only (no avatarUrl). */
export const DEMO_PEOPLE: DemoPerson[] = DEMO_ROSTER_NAMES.map(
  (displayName, i) => {
    const slug = slugPerson(displayName);
    const isCoach = i < 2;
    return {
      userId: isCoach ? `demo_coach_${slug}` : `demo_runner_${slug}`,
      displayName,
      role: isCoach ? ("coach" as const) : ("member" as const),
      // Spread paces across A–D bands for group demos
      paceSecondsPerKm: 255 + (i % 16) * 12,
    };
  },
);

export const DEMO_COACH_PRIMARY = DEMO_PEOPLE[0]!;
export const DEMO_COACH_SECONDARY = DEMO_PEOPLE[1]!;

export function demoCoachUserIdForName(coachName: string): string {
  const match = DEMO_PEOPLE.find(
    (p) => p.role === "coach" && p.displayName === coachName,
  );
  if (match) return match.userId;
  // Alternate hosts by name hash for variety
  const idx = coachName.length % 2;
  return (idx === 0 ? DEMO_COACH_PRIMARY : DEMO_COACH_SECONDARY).userId;
}

/** Resolve any roster member as Accueil host (coaches + runners). */
export function demoHostUserIdForName(hostName: string): string {
  const exact = DEMO_PEOPLE.find((p) => p.displayName === hostName);
  if (exact) return exact.userId;
  return demoCoachUserIdForName(hostName);
}
