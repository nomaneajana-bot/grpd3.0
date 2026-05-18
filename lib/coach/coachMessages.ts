/** Reusable French coach copy — tutoiement, short, actionable. */

export const coachMessages = {
  comeback:
    "Ça fait une semaine sans sortie. Reprends par 20–30 min très faciles, marche incluse.",
  overload:
    "Deux séances dures récentes : aujourd'hui reste en footing conversationnel.",
  recovery:
    "La récupération fait partie du plan. Garde l'effort facile et régulier.",
  easyRun:
    "Reste facile. Si tu ne peux pas parler, tu vas trop vite.",
  fartlek:
    "Ne sprinte pas la première répétition. Garde de la marge pour finir la série.",
  tempo:
    "Cherche une allure stable. Tu dois finir fort, pas explosé.",
  interval:
    "Respecte les temps de récup. La qualité des efforts prime sur le volume.",
  walk:
    "La marche compte aussi. L'objectif est de te présenter et garder le rythme.",
  defaultSession:
    "Reste lucide sur l'effort. Termine la séance proprement.",
  streakZero: "Ta première séance démarre ta série. Présente-toi, même court.",
  streakBuilding: (n: number) =>
    `${n} séances : la régularité s'installe. Garde le même créneau cette semaine.`,
  streakReliable: (n: number) =>
    `${n} séances : tu deviens fiable. Protège le facile entre les gros jours.`,
  groupSlow:
    "Allure lente, c'est du travail sérieux. Tu construis la base sans te comparer.",
  groupFast:
    "Garde le contrôle. La constance sur le groupe prime sur le chrono du jour.",
  feedbackTropFacile:
    "Parfait. Monte légèrement la charge, sans casser ta régularité.",
  feedbackJusteBien:
    "C'est la zone qu'on cherche. Répète avant d'intensifier.",
  feedbackTropDur:
    "Descends d'un groupe la prochaine fois. Finir propre compte plus qu'une allure héroïque.",
  weeklyEmpty:
    "Ajoute une séance cette semaine. Un créneau fixe bat une intention vague.",
  weeklyOne:
    "Une séance, c'est déjà un ancrage. Garde le même jour la semaine prochaine.",
  weeklyBalanced: (n: number) =>
    `${n} sorties prévues : alterne qualité et facile. Ne empile pas deux gros jours d'affilée.`,
  weeklyHeavy:
    "Charge élevée : surveille le sommeil et le facile entre les séances denses.",
  dailyFallback:
    "Aujourd'hui, priorise une séance propre. Une sortie maîtrisée vaut mieux qu'un chrono moyen.",
  generic:
    "Concentre-toi sur l'objectif du jour : qualité des efforts, allure stable, fin propre.",
  builderFartlekReps:
    "6 à 10 répétitions courtes, c'est un bon point de départ. Ajuste selon ton niveau.",
  builderFartlekPace:
    "Effort modéré, pas sprint. Tu dois pouvoir enchaîner la série sans t'effondrer.",
  builderFartlekDuration:
    "20 à 35 minutes de jeu total, échauffement inclus. Garde 2 minutes faciles entre les blocs.",
  builderTempoDuration:
    "20 à 40 minutes continues au tempo. Mieux vaut tenir que de partir trop vite.",
  builderTempoWarmup:
    "15 minutes faciles, quelques accélérations courtes. Puis enchaîne le bloc tempo.",
  builderTempoRecovery:
    "Le lendemain : facile ou repos. Pas de tempo bâtonné deux jours d'affilée.",
  builderIntervalDistance:
    "Garde la distance des répétitions alignée avec ton objectif du jour. Ne change pas en cours de séance.",
  builderIntervalRecovery:
    "Récup active marche. Temps de récup = 50 à 100% de l'effort, selon l'intensité.",
  builderIntervalSets:
    "4 à 8 séries utiles. Si la qualité baisse, tu arrêtes avant le plan sur le papier.",
} as const;
