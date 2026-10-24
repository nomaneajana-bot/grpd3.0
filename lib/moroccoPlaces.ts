/** Shared Morocco city + Casablanca location catalogs for sliders. */

export const MOROCCO_CITIES = [
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Tanger",
  "Fès",
  "Agadir",
  "Mohammedia",
  "Salé",
] as const;

export type MoroccoCity = (typeof MOROCCO_CITIES)[number];

/** Default rendez-vous spots — Casablanca-first, reused as location slider options. */
export const DEFAULT_LOCATIONS = [
  "Marina",
  "Corniche El Hank",
  "Parc de la Ligue Arabe",
  "Anfa Park",
  "Racine",
  "Maarif",
  "Ain Diab",
  "Forêt de Bouskoura",
  "Parc",
  "Piste",
] as const;

export type DefaultLocation = (typeof DEFAULT_LOCATIONS)[number];
