import type { ImageSourcePropType } from "react-native";

export type PitchSlide = {
  id: string;
  step: string;
  /** Original 7-step structure label (shown small). */
  label: string;
  headline: string;
  body: string;
  image: ImageSourcePropType;
  imageKind: "photo" | "phone";
  accentKey: keyof typeof import("./pitchTheme").pitchTheme.step;
};

/**
 * Structure: Accroche → Problème → Solution → Cible → Valeur → Crédibilité → CTA.
 * Visuals only from the uploaded GRpD PDF.
 */
export const PITCH_SLIDES: PitchSlide[] = [
  {
    id: "accroche",
    step: "01",
    label: "L'accroche",
    headline: "Tout le monde déteste courir.",
    body: "(et nous aussi)",
    image: require("../../assets/pitch/01-deteste-courir.jpg"),
    imageKind: "photo",
    accentKey: "accroche",
  },
  {
    id: "probleme",
    step: "02",
    label: "Le problème",
    headline: "Courir seul, c'est dur.",
    body: "Pas de rythme. Pas de groupe. Pas d'envie.",
    image: require("../../assets/pitch/02-groupe.jpg"),
    imageKind: "photo",
    accentKey: "probleme",
  },
  {
    id: "solution",
    step: "03",
    label: "La solution",
    headline: "GRpD réunit sorties et allures.",
    body: "Femmes · marche · groupes A à D.",
    image: require("../../assets/pitch/03-sessions.jpg"),
    imageKind: "phone",
    accentKey: "solution",
  },
  {
    id: "cible",
    step: "04",
    label: "La cible",
    headline: "Débutant ou marathonien.",
    body: "Coureurs, marcheurs, organisateurs — d'abord à Casa.",
    image: require("../../assets/pitch/04-allures.jpg"),
    imageKind: "phone",
    accentKey: "cible",
  },
  {
    id: "valeur",
    step: "05",
    label: "La proposition de valeur",
    headline: "Vous ne courrez plus jamais seul.",
    body: "Votre rythme. Votre groupe. Ensemble.",
    image: require("../../assets/pitch/05-ensemble.jpg"),
    imageKind: "photo",
    accentKey: "valeur",
  },
  {
    id: "credibilite",
    step: "06",
    label: "La crédibilité",
    headline: "Déjà sur le terrain.",
    body: "Communautés locales. Partenaires. Impact réel.",
    image: require("../../assets/pitch/06-depart.jpg"),
    imageKind: "photo",
    accentKey: "credibilite",
  },
  {
    id: "cta",
    step: "07",
    label: "L'appel à l'action",
    headline: "Rejoignez le pilote Casa.",
    body: "Partenaires · clubs · soutiens.",
    image: require("../../assets/pitch/07-merci.jpg"),
    imageKind: "photo",
    accentKey: "cta",
  },
];
