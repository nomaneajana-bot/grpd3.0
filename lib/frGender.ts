/**
 * French gender agreement helpers for runner-facing copy.
 * Based on onboarding / profile gender (homme | femme).
 */

export type UserGender = "female" | "male";

export function isFemale(gender?: UserGender | null): boolean {
  return gender === "female";
}

/** prêt / prête */
export function adjPret(gender?: UserGender | null): string {
  return isFemale(gender) ? "prête" : "prêt";
}

/** inscrit / inscrite */
export function adjInscrit(gender?: UserGender | null): string {
  return isFemale(gender) ? "inscrite" : "inscrit";
}

/** organisateur / organisatrice */
export function nounOrganisateur(gender?: UserGender | null): string {
  return isFemale(gender) ? "organisatrice" : "organisateur";
}

/** coureur / coureuse */
export function nounCoureur(gender?: UserGender | null): string {
  return isFemale(gender) ? "Coureuse" : "Coureur";
}

/** content / contente */
export function adjContent(gender?: UserGender | null): string {
  return isFemale(gender) ? "contente" : "content";
}

/** allé / allée */
export function adjAlle(gender?: UserGender | null): string {
  return isFemale(gender) ? "allée" : "allé";
}

/** nouveau / nouvelle */
export function adjNouveau(gender?: UserGender | null): string {
  return isFemale(gender) ? "nouvelle" : "nouveau";
}

export function genderLabel(gender?: UserGender | null): string {
  if (gender === "female") return "Femme";
  if (gender === "male") return "Homme";
  return "";
}
