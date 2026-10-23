import type { ImageSourcePropType } from "react-native";

export type PitchSlide = {
  id: string;
  step: string;
  headline: string;
  body: string;
  image: ImageSourcePropType;
  /** Photos fill the panel; app shots keep a phone frame. */
  imageKind: "photo" | "phone";
  accentKey: keyof typeof import("./pitchTheme").pitchTheme.step;
};

/** Visuals only from uploaded GRpD PDF. */
export const PITCH_SLIDES: PitchSlide[] = [
  {
    id: "hook",
    step: "01",
    headline: "Tout le monde déteste courir.",
    body: "(et nous aussi)",
    image: require("../../assets/pitch/01-deteste-courir.jpg"),
    imageKind: "photo",
    accentKey: "accroche",
  },
  {
    id: "rythme",
    step: "02",
    headline: "Votre rythme. Votre groupe.",
    body: "Trouver les bons gens, à la bonne allure.",
    image: require("../../assets/pitch/02-groupe.jpg"),
    imageKind: "photo",
    accentKey: "probleme",
  },
  {
    id: "place",
    step: "03",
    headline: "Une place pour chacun.",
    body: "Femmes · marche · allures A à D.",
    image: require("../../assets/pitch/03-sessions.jpg"),
    imageKind: "phone",
    accentKey: "solution",
  },
  {
    id: "allures",
    step: "04",
    headline: "Rejoins à ton niveau.",
    body: "Groupe recommandé. Zéro jugement.",
    image: require("../../assets/pitch/04-allures.jpg"),
    imageKind: "phone",
    accentKey: "cible",
  },
  {
    id: "ensemble",
    step: "05",
    headline: "Ensemble.",
    body: "Vous ne courrez plus jamais seul.",
    image: require("../../assets/pitch/05-ensemble.jpg"),
    imageKind: "photo",
    accentKey: "valeur",
  },
  {
    id: "impact",
    step: "06",
    headline: "Du solo au peloton.",
    body: "Communautés locales. Impact réel.",
    image: require("../../assets/pitch/06-depart.jpg"),
    imageKind: "photo",
    accentKey: "credibilite",
  },
  {
    id: "cta",
    step: "07",
    headline: "Rejoignez le pilote Casa.",
    body: "Partenaires · clubs · soutiens.",
    image: require("../../assets/pitch/07-merci.jpg"),
    imageKind: "photo",
    accentKey: "cta",
  },
];
