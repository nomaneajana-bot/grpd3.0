export type PitchSlide = {
  id: string;
  step: string;
  label: string;
  question: string;
  headline: string;
  body: string;
  tip: string;
  accentKey: keyof typeof import("./pitchTheme").pitchTheme.step;
};

export const PITCH_SLIDES: PitchSlide[] = [
  {
    id: "accroche",
    step: "01",
    label: "L'accroche",
    question: "Comment capter l'attention dès les premières secondes ?",
    headline: "À Casablanca, des milliers de foulées restent solo.",
    body: "Pas par manque d'envie — par manque d'un endroit clair pour trouver sa sortie, son allure, et des gens avec qui avancer sans se justifier.",
    tip: "Corniche, 8h — téléphone en main, groupe WhatsApp muet.",
    accentKey: "accroche",
  },
  {
    id: "probleme",
    step: "02",
    label: "Le problème",
    question: "Quel est le problème ou le besoin auquel vous répondez ?",
    headline: "Bouger ensemble est encore trop compliqué.",
    body: "Les apps de perf jugent le rythme. Les clubs vivent dans des fils illisibles. Le networking reste froid et formel. Résultat : on reste chez soi, ou on court seul.",
    tip: "Chaos d'organisation + pression sociale + aucun niveau clair.",
    accentKey: "probleme",
  },
  {
    id: "solution",
    step: "03",
    label: "La solution",
    question: "Quelle est votre solution et comment fonctionne-t-elle ?",
    headline: "GRPD réunit clubs, sorties et allures — sans chrono ni pression.",
    body: "Tu vois les prochaines sorties, tu rejoins à ton niveau, tu organises pour ton club. Public ou réservé aux membres. Une place pour courir, marcher, et se retrouver.",
    tip: "Découvrir → rejoindre → organiser, dans une seule app.",
    accentKey: "solution",
  },
  {
    id: "cible",
    step: "04",
    label: "La cible",
    question: "À qui s'adresse votre projet ?",
    headline: "Coureurs, marcheurs et organisateurs — d'abord à Casa.",
    body: "Ceux qui veulent une communauté locale fiable. Les clubs qui cherchent un vrai outil, pas un groupe WhatsApp. Demain : marches entrepreneurs, English walking, cercles d'intérêt.",
    tip: "Membres actifs · responsables de club · nouveaux en ville.",
    accentKey: "cible",
  },
  {
    id: "valeur",
    step: "05",
    label: "La proposition de valeur",
    question: "Qu'est-ce qui rend votre solution utile, unique et meilleure ?",
    headline: "Le mouvement comme lien — pas un feed, pas un classement.",
    body: "Utile : une sortie claire en trente secondes. Unique : structure de club + bienveillance intégrée. Meilleure que Strava (ego) ou Meetup (générique) : l'expérience est locale, incarnée, et sans jugement.",
    tip: "Inclusion · allures · clubs · zéro mécanique de likes.",
    accentKey: "valeur",
  },
  {
    id: "credibilite",
    step: "06",
    label: "La crédibilité",
    question: "Pourquoi peut-on vous faire confiance pour réussir ?",
    headline: "Un produit déjà vivant, une vision déjà tracée.",
    body: "MVP opérationnel : clubs, invitations, organisation de séances, groupes d'allure, parcours membre. Design Casablanca abouti. Feuille de route : des communautés reliées par le mouvement.",
    tip: "Produit utilisable · pilote local · roadmap running → walking → cercles.",
    accentKey: "credibilite",
  },
  {
    id: "cta",
    step: "07",
    label: "L'appel à l'action",
    question: "Quelle est la prochaine étape et que demandez-vous ?",
    headline: "Rejoignez le pilote Casablanca.",
    body: "On cherche partenaires, clubs pilotes et soutiens pour accélérer le déploiement. Testez le produit, ouvrez votre club, ou construisez la suite avec nous.",
    tip: "Essai produit · partenariat club · introduction réseau.",
    accentKey: "cta",
  },
];
