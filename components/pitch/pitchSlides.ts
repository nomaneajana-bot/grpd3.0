import type { ImageSourcePropType } from "react-native";

export type PitchSlide = {
  id: string;
  step: string;
  label: string;
  headline: string;
  bullets: string[];
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
    bullets: [
      "(et nous aussi)",
      "Réveil. Baskets. WhatsApp muet.",
      "L'envie est là — le groupe, rarement.",
    ],
    image: require("../../assets/pitch/01-deteste-courir.jpg"),
    imageKind: "photo",
    accentKey: "accroche",
  },
  {
    id: "probleme",
    step: "02",
    label: "Le problème",
    headline: "Bouger ensemble est encore trop dur.",
    bullets: [
      "Apps de perf qui jugent le rythme",
      "Clubs coincés dans des fils illisibles",
      "Networking froid, sorties solo par défaut",
      "Aucun niveau clair → on reste chez soi",
    ],
    image: require("../../assets/pitch/02-groupe.jpg"),
    imageKind: "photo",
    accentKey: "probleme",
  },
  {
    id: "solution",
    step: "03",
    label: "La solution",
    headline: "GRpD : clubs, sorties, allures.",
    bullets: [
      "Découvrir une sortie en quelques secondes",
      "Rejoindre à son niveau (A → D)",
      "Sessions 100% femmes & clubs de marche",
      "Organiser pour son club, public ou privé",
    ],
    image: require("../../assets/pitch/03-sessions.jpg"),
    imageKind: "phone",
    accentKey: "solution",
  },
  {
    id: "cible",
    step: "04",
    label: "La cible",
    headline: "À qui s'adresse GRpD ?",
    bullets: [
      "Coureurs & marcheurs — débutant → marathonien",
      "Organisateurs de clubs locaux",
      "Nouveaux en ville qui cherchent leur groupe",
      "D'abord Casablanca, puis d'autres villes",
    ],
    image: require("../../assets/pitch/04-allures.jpg"),
    imageKind: "phone",
    accentKey: "cible",
  },
  {
    id: "valeur",
    step: "05",
    label: "La proposition de valeur",
    headline: "Vous ne courrez plus jamais seul.",
    bullets: [
      "Utile : une place claire, à ton allure",
      "Unique : mouvement + communauté, pas un feed",
      "Mieux que Strava (ego) ou Meetup (générique)",
      "Zéro jugement. Zéro likes. Juste sortir.",
    ],
    image: require("../../assets/pitch/05-ensemble.jpg"),
    imageKind: "photo",
    accentKey: "valeur",
  },
  {
    id: "credibilite",
    step: "06",
    label: "La crédibilité",
    headline: "Déjà sur le terrain.",
    bullets: [
      "Produit vivant : clubs, séances, allures",
      "Communautés locales & partenaires terrain",
      "Impact social gratuit + modèle B2B / IA",
      "Roadmap claire : running → marche → cercles",
    ],
    image: require("../../assets/pitch/06-depart.jpg"),
    imageKind: "photo",
    accentKey: "credibilite",
  },
  {
    id: "cta",
    step: "07",
    label: "L'appel à l'action",
    headline: "Rejoignez le pilote Casa.",
    bullets: [
      "Tester le produit avec votre club",
      "Ouvrir un club pilote",
      "Partenariat ou introduction réseau",
      "Construire la suite avec nous",
    ],
    image: require("../../assets/pitch/07-merci.jpg"),
    imageKind: "photo",
    accentKey: "cta",
  },
];
