import type { SessionData } from './sessionData';

export const EXPERIENCE_CATEGORIES = [
  { id: 'all', label: 'Tout', icon: 'compass-outline', color: '#BCE6C9' },
  { id: 'community', label: 'Communauté', icon: 'people-outline', color: '#BCE6C9' },
  { id: 'language', label: 'Langues', icon: 'chatbubbles-outline', color: '#D5C8F5' },
  { id: 'expert', label: 'Avec un expert', icon: 'bulb-outline', color: '#F3CF9E' },
  { id: 'singles', label: 'Célibataires', icon: 'heart-outline', color: '#EABFCB' },
  { id: 'training', label: 'Entraînement', icon: 'fitness-outline', color: '#B9D5F0' },
] as const;
export type ExperienceCategory = typeof EXPERIENCE_CATEGORIES[number]['id'];
export type Activity = 'all' | 'walk' | 'run';
export const OUTING_TYPES = {
  community: { walk: 'COMMUNAUTÉ · MARCHE', run: 'COMMUNAUTÉ · COURSE' },
  language: { walk: 'LANGUES · MARCHE', run: 'LANGUES · COURSE' },
} as const;
export function categoryForSession(session: Pick<SessionData, 'typeLabel' | 'experience'>): ExperienceCategory {
  if (session.experience?.kind === 'community') return session.experience.format === 'language' ? 'language' : 'community';
  if (session.typeLabel.startsWith('LANGUES ·')) return 'language';
  if (session.typeLabel.startsWith('COMMUNAUTÉ ·')) return 'community';
  return 'training';
}
export function isSocialOuting(session: Pick<SessionData, 'typeLabel' | 'experience'>): boolean {
  return categoryForSession(session) !== 'training';
}
export function activityForSession(session: Pick<SessionData, 'typeLabel' | 'experience'>): Exclude<Activity, 'all'> {
  if (session.experience?.kind === 'community') return session.experience.activity;
  return /MARCHE|WALK/i.test(session.typeLabel) ? 'walk' : 'run';
}
export function matchesSession(session: SessionData, category: ExperienceCategory, activity: Activity, query: string): boolean {
  return (category === 'all' || categoryForSession(session) === category)
    && (activity === 'all' || activityForSession(session) === activity)
    && `${session.title} ${session.spot} ${session.coachName ?? ''} ${session.coachAdvice ?? ''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}
export function isUpcoming(session: Pick<SessionData, 'dateISO' | 'timeMinutes'>, now = new Date()): boolean {
  if (!session.dateISO) return false;
  if (session.dateISO.includes('T')) return Date.parse(session.dateISO) >= now.getTime();
  const [year, month, day] = session.dateISO.split('-').map(Number);
  const minutes = session.timeMinutes ?? 1439;
  return new Date(year, month - 1, day, Math.floor(minutes / 60), minutes % 60).getTime() >= now.getTime();
}
export function parseOutingDate(date: string, time: string, now = new Date()): { dateISO: string; timeMinutes: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const value = new Date(y, m - 1, d, h, min);
  if (h > 23 || min > 59 || value.getFullYear() !== y || value.getMonth() !== m - 1 || value.getDate() !== d || value <= now) return null;
  return { dateISO: date, timeMinutes: h * 60 + min };
}
export type ExperiencePreview = {
  id: string; category: ExperienceCategory; activity: Exclude<Activity, 'all'>;
  title: string; subtitle: string; eyebrow: string; duration: string; price: string;
  description: string; host: string; plan: string[]; color: string;
};
// Editorial concepts only: no invented live hosts, dates, attendance, or purchasable tickets.
export const EXPERIENCE_PREVIEWS: ExperiencePreview[] = [
  { id: 'fajr', category: 'community', activity: 'walk', title: 'Le jour se lève.\nOn marche ensemble.', subtitle: 'Le club des petits matins', eyebrow: 'APRÈS FAJR', duration: '40 min', price: 'Format gratuit', color: '#BCE6C9', host: 'Un hôte de la communauté', description: 'Après salat Fajr, prolonger le calme du matin par une marche de quartier. Un rendez-vous régulier, des visages familiers et le plaisir de commencer la journée ensemble.', plan: ['Se retrouver après la prière, au point choisi par le club.', 'Marcher à une allure tranquille, avec le temps de discuter.', 'Se donner rendez-vous pour la prochaine sortie. L’hôte confirme l’heure locale pour chaque date.'] },
  { id: 'english', category: 'language', activity: 'walk', title: 'Walk a little.\nTalk a lot.', subtitle: 'English Walk & Talk', eyebrow: 'APPRENDRE ENSEMBLE', duration: '60 min', price: 'Échange libre ou guidé', color: '#D5C8F5', host: 'Un animateur de conversation ou un professeur', description: 'Pratiquer l’anglais en marchant, autour d’un nouveau sujet à chaque sortie. Des petits groupes selon l’aisance à l’oral, pour oser parler et faire connaissance.', plan: ['Faire connaissance et choisir un sujet de conversation.', 'Marcher et échanger en binômes, puis changer de partenaire.', 'Partager les mots découverts. Le format précise s’il s’agit d’un échange gratuit ou d’un cours animé.'] },
  { id: 'founder', category: 'expert', activity: 'walk', title: 'Une idée. Une marche.\nUne autre perspective.', subtitle: 'Dans les pas d’un entrepreneur', eyebrow: 'CONVERSATIONS QUI COMPTENT', duration: '60 min', price: 'Format payant à venir', color: '#F3CF9E', host: 'Un entrepreneur invité, à confirmer', description: 'Sortir de la salle de réunion pour une conversation en petit groupe. Poser ses questions, découvrir un parcours et réfléchir ensemble en marchant.', plan: ['Découvrir le parcours et le sujet proposé par l’invité.', 'Marcher en petit groupe avec du temps pour les questions.', 'Repartir avec des pistes concrètes. L’invité, le tarif et les conditions seront annoncés avant toute réservation.'] },
  { id: 'french-run', category: 'language', activity: 'run', title: 'On court doucement.\nOn parle français.', subtitle: 'French Run & Talk', eyebrow: 'LANGUES EN MOUVEMENT', duration: '45 min', price: 'Échange libre ou guidé', color: '#B9D5F0', host: 'Un animateur francophone', description: 'Une course facile pour pratiquer le français et rencontrer du monde. L’allure laisse de la place à la conversation, avec des pauses marchées pour échanger.', plan: ['Se présenter et rejoindre un groupe adapté à son aisance à l’oral.', 'Courir à une allure de conversation, avec des pauses marchées.', 'Échanger sur le thème du jour. Niveau de langue et confort en course sont indiqués séparément.'] },
  { id: 'singles', category: 'singles', activity: 'walk', title: 'Un premier pas.\nPeut-être une rencontre.', subtitle: 'La marche des célibataires', eyebrow: 'UNE INTENTION PARTAGÉE', duration: '60 min', price: 'Format animé à venir', color: '#EABFCB', host: 'Un hôte qui facilite les présentations', description: 'Une marche dédiée aux adultes célibataires qui souhaitent faire des rencontres amoureuses. Une intention claire et un cadre convivial pour discuter sans pression.', plan: ['Choisir explicitement une sortie célibataires, réservée aux adultes.', 'Faire connaissance à travers des échanges animés par l’hôte.', 'Garder le contact uniquement si l’envie est réciproque. Ce format reste en préparation.'] },
];
