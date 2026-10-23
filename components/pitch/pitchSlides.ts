import type { ImageSourcePropType } from "react-native";

export type PitchSlide = {
  id: string;
  step: string;
  headline: string;
  body: string;
  image: ImageSourcePropType;
  accentKey: keyof typeof import("./pitchTheme").pitchTheme.step;
};

export const PITCH_SLIDES: PitchSlide[] = [
  {
    id: "hook",
    step: "01",
    headline: "À Casa, trop de foulées restent solo.",
    body: "L'envie est là. Le groupe fiable, non.",
    image: require("../../assets/pitch/01-home.png"),
    accentKey: "accroche",
  },
  {
    id: "problem",
    step: "02",
    headline: "Bouger ensemble est encore trop dur.",
    body: "WhatsApp illisible. Apps qui jugent. Clubs fermés.",
    image: require("../../assets/pitch/02-join.png"),
    accentKey: "probleme",
  },
  {
    id: "solution",
    step: "03",
    headline: "GRPD : clubs, sorties, allures.",
    body: "Sans chrono. Sans pression. Une place pour se retrouver.",
    image: require("../../assets/pitch/03-accueil.png"),
    accentKey: "solution",
  },
  {
    id: "audience",
    step: "04",
    headline: "Coureurs, marcheurs, organisateurs.",
    body: "D'abord Casablanca. Puis d'autres communautés.",
    image: require("../../assets/pitch/04-clubs.png"),
    accentKey: "cible",
  },
  {
    id: "value",
    step: "05",
    headline: "Le mouvement comme lien.",
    body: "Pas un feed. Pas un classement. Une sortie claire.",
    image: require("../../assets/pitch/05-sortie.png"),
    accentKey: "valeur",
  },
  {
    id: "proof",
    step: "06",
    headline: "Un produit déjà vivant.",
    body: "Clubs, invitations, séances, groupes d'allure.",
    image: require("../../assets/pitch/06-sorties.png"),
    accentKey: "credibilite",
  },
  {
    id: "cta",
    step: "07",
    headline: "Rejoignez le pilote Casa.",
    body: "Partenaires, clubs, soutiens — construisons la suite.",
    image: require("../../assets/pitch/07-avenir.png"),
    accentKey: "cta",
  },
];
