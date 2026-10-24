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
 * Structure: Accroche → Problème → Solution → Cible → Valeur → Business model → Crédibilité → CTA.
 * Visuals only from the uploaded GRpD PDF.
 */
export const PITCH_SLIDES: PitchSlide[] = [
  {
    id: "accroche",
    step: "01",
    label: "L'accroche",
    headline: "Tout le monde déteste courir.",
    bullets: [
      "Et nous aussi — franchement.",
      "Tu mets les baskets, tu ouvres le téléphone… et personne.",
      "Ce n'est pas le sport le problème. C'est de le faire seul.",
    ],
    image: require("../../assets/pitch/01-deteste-courir.jpg"),
    imageKind: "photo",
    accentKey: "accroche",
  },
  {
    id: "probleme",
    step: "02",
    label: "Le problème",
    headline: "On veut bouger avec des gens. Pas survivre à une appli.",
    bullets: [
      "Les apps te chronomètrent et te comparent.",
      "Les clubs vivent dans des WhatsApp où tout se perd.",
      "Tu ne sais jamais si tu seras trop lent, trop vite, ou de trop.",
      "Alors tu annules. Encore une fois.",
    ],
    image: require("../../assets/pitch/02-groupe.jpg"),
    imageKind: "photo",
    accentKey: "probleme",
  },
  {
    id: "solution",
    step: "03",
    label: "La solution",
    headline: "GRpD, c'est simplement : on sort ensemble.",
    bullets: [
      "Tu vois les prochaines sorties près de toi.",
      "Tu choisis ton allure — sans te justifier.",
      "Il y a de la place pour la marche, pour les femmes, pour reprendre.",
      "Et si tu organises, ton club a enfin un vrai chez-soi.",
    ],
    image: require("../../assets/pitch/03-sessions.jpg"),
    imageKind: "phone",
    accentKey: "solution",
  },
  {
    id: "cible",
    step: "04",
    label: "La cible",
    headline: "Pour ceux qui veulent une vraie bande.",
    bullets: [
      "Ceux qui reprennent, et ceux qui enchaînent les kilomètres.",
      "Les marcheurs qui veulent du lien, pas une compétition.",
      "Les gens qui arrivent à Casa et cherchent « leurs » sorties.",
      "Les organisateurs fatigués de tout gérer dans le chat.",
    ],
    image: require("../../assets/pitch/04-allures.jpg"),
    imageKind: "phone",
    accentKey: "cible",
  },
  {
    id: "valeur",
    step: "05",
    label: "La proposition de valeur",
    headline: "Le mouvement comme excuse pour se retrouver.",
    bullets: [
      "Tu sais avec qui tu cours — et à quel rythme.",
      "Pas de feed, pas de likes, pas de classement qui pique.",
      "Moins froid qu'un afterwork. Plus vivant qu'une appli solo.",
      "Tu ne courras plus jamais en te demandant si tu as ta place.",
    ],
    image: require("../../assets/pitch/05-ensemble.jpg"),
    imageKind: "photo",
    accentKey: "valeur",
  },
  {
    id: "business",
    step: "06",
    label: "Le modèle économique",
    headline: "Gratuit pour sortir. Payant pour faire grandir.",
    bullets: [
      "La communauté reste libre — rejoindre et sortir ne se monétise pas.",
      "Les clubs et organisateurs paient pour des outils qui leur font gagner du temps.",
      "Les marques et événements rejoignent des gens qui bougent vraiment.",
      "Plus tard : coaching et services premium — sans transformer GRpD en feed.",
    ],
    image: require("../../assets/pitch/06-depart.jpg"),
    imageKind: "photo",
    accentKey: "business",
  },
  {
    id: "credibilite",
    step: "07",
    label: "La crédibilité",
    headline: "Ce n'est pas une idée sur un slide.",
    bullets: [
      "Le produit tourne déjà : clubs, séances, groupes d'allure.",
      "On est ancrés à Casa, avec des partenaires de terrain.",
      "On construit avec des gens qui sortent vraiment — pas seulement des slides.",
      "Demain : plus de villes, plus de façons de se retrouver en bougeant.",
    ],
    image: require("../../assets/pitch/05-ensemble.jpg"),
    imageKind: "photo",
    accentKey: "credibilite",
  },
  {
    id: "cta",
    step: "08",
    label: "L'appel à l'action",
    headline: "Viens faire le prochain tour avec nous.",
    bullets: [
      "Fais essayer GRpD à ton club.",
      "Ou ouvre un club pilote à Casa.",
      "Si tu peux nous ouvrir des portes — où nous présenter — on est prêts.",
      "On construit ça avec les gens qui sortent vraiment.",
    ],
    image: require("../../assets/pitch/07-merci.jpg"),
    imageKind: "photo",
    accentKey: "cta",
  },
];
