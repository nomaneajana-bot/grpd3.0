import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createApiClient, listSessions } from '@/lib/api';
import { getUserSessions } from '@/lib/sessionStore';
import { apiSessionToSessionData, type SessionData } from '@/lib/sessionData';
import { EXPERIENCE_CATEGORIES, EXPERIENCE_PREVIEWS, activityForSession, categoryForSession, isSocialOuting, isUpcoming, matchesSession, type Activity, type ExperienceCategory } from '@/lib/experiences';
import { Action, TrailArt, experienceTheme as t, ui } from '@/components/experiences/ExperienceUI';

export default function DiscoverScreen() {
  const [category, setCategory] = useState<ExperienceCategory>('all');
  const [activity, setActivity] = useState<Activity>('all');
  const [query, setQuery] = useState('');
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const results = await Promise.allSettled([listSessions(createApiClient(), { from }), getUserSessions()]);
    const api = results[0];
    const local = results[1];
    const merged = new Map<string, SessionData>();
    if (local.status === 'fulfilled') local.value.forEach(s => merged.set(s.id, s));
    if (api.status === 'fulfilled') api.value.sessions.map(apiSessionToSessionData).forEach(s => merged.set(s.id, s));
    setSessions([...merged.values()].filter(s => s.visibility !== 'members' && isUpcoming(s)).sort((a, b) => `${a.dateISO} ${String(a.timeMinutes ?? 0).padStart(4, '0')}`.localeCompare(`${b.dateISO} ${String(b.timeMinutes ?? 0).padStart(4, '0')}`)));
    setError(api.status === 'rejected');
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const visible = useMemo(() => sessions.filter(s => matchesSession(s, category, activity, query)), [sessions, category, activity, query]);
  const previews = EXPERIENCE_PREVIEWS.filter(p => (category === 'all' || p.category === category) && (activity === 'all' || p.activity === activity) && `${p.title} ${p.subtitle} ${p.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <SafeAreaView style={ui.safe} edges={['top']}><ScrollView contentContainerStyle={ui.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={t.accent}/> }>
    <View style={ui.row}><Text style={ui.eyebrow}>G R P D / EN BONNE COMPAGNIE</Text><Pressable accessibilityRole="button" accessibilityLabel="Mes messages" onPress={() => router.push('/inbox')}><Ionicons name="chatbubble-ellipses-outline" color={t.text} size={23}/></Pressable></View>
    <View style={{ gap: 12, paddingVertical: 12 }}><Text style={ui.title}>Dehors. Ensemble.{'\n'}Pour quelque chose.</Text><Text style={[ui.body, { maxWidth: 520 }]}>Une marche pour se rencontrer. Un run pour pratiquer une langue. Un club où revenir.</Text></View>
    <View style={[ui.input, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}><Ionicons name="search" color={t.muted} size={20}/><TextInput accessibilityLabel="Rechercher une sortie, une ville ou une langue" placeholder="Une ville, une langue, une envie…" placeholderTextColor={t.muted} value={query} onChangeText={setQuery} style={{ color: t.text, flex: 1, fontSize: 15, minWidth: 0, paddingVertical: 2 }}/>{query ? <Pressable accessibilityRole="button" accessibilityLabel="Effacer la recherche" onPress={() => setQuery('')}><Ionicons name="close-circle" color={t.muted} size={20}/></Pressable> : null}</View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{EXPERIENCE_CATEGORIES.map(c => <Pressable key={c.id} accessibilityRole="button" accessibilityState={{ selected: category === c.id }} onPress={() => setCategory(c.id)} style={[ui.chip, category === c.id && ui.chipOn]}><Ionicons name={c.icon} size={17} color={category === c.id ? t.bg : c.color}/><Text style={[ui.chipText, category === c.id && { color: t.bg }]}>{c.label}</Text></Pressable>)}</ScrollView>
    <View style={{ flexDirection: 'row', gap: 18 }}>{([{ id: 'all', label: 'Marche & course' }, { id: 'walk', label: 'Marche' }, { id: 'run', label: 'Course' }] as const).map(a => <Pressable key={a.id} accessibilityRole="button" accessibilityState={{ selected: activity === a.id }} onPress={() => setActivity(a.id)} style={{ paddingBottom: 9, borderBottomWidth: 2, borderBottomColor: activity === a.id ? t.accent : 'transparent' }}><Text style={[ui.chipText, activity === a.id && { color: t.text }]}>{a.label}</Text></Pressable>)}</View>
    <View style={{ gap: 14 }}><View style={ui.row}><Text style={ui.heading}>Les prochaines sorties</Text><Ionicons name="arrow-down-outline" color={t.accent} size={20}/></View>
      {error && <View style={{ gap: 10 }}><Text style={ui.error}>Les sorties en ligne ne sont pas disponibles pour le moment.</Text><Action secondary label="Réessayer" onPress={() => void load()}/></View>}
      {loading && !sessions.length ? <ActivityIndicator color={t.accent}/> : visible.length ? visible.map(s => <Pressable accessibilityRole="button" key={s.id} onPress={() => router.push((isSocialOuting(s) ? `/outing/${s.id}` : `/session/${s.id}`) as Href)} style={ui.card}><Text style={ui.eyebrow}>{EXPERIENCE_CATEGORIES.find(c => c.id === categoryForSession(s))?.label.toUpperCase()} · {activityForSession(s) === 'walk' ? 'MARCHE' : 'COURSE'}</Text><Text style={ui.heading}>{s.title}</Text><Text style={ui.body}>{s.dateLabel} · {s.spot}</Text><View style={ui.row}><Text style={ui.body}>{s.coachName ? `Avec ${s.coachName}` : 'Voir les détails'}</Text><Text style={{ color: t.accent }}>{isSocialOuting(s) ? 'Gratuit →' : 'Découvrir →'}</Text></View></Pressable>) : <View style={ui.card}><Text style={[ui.heading, { fontSize: 18 }]}>{query || category !== 'all' || activity !== 'all' ? 'Pas encore de sortie pour cette recherche.' : 'La prochaine rencontre commence avec vous.'}</Text><Text style={ui.body}>Propose une marche ou une course conviviale et invite les premières personnes à te rejoindre.</Text><Action label="Proposer une sortie gratuite" onPress={() => router.push('/outing/create' as Href)}/></View>}
    </View>
    {previews.length > 0 && <View style={{ gap: 14 }}><Text style={ui.heading}>Imagine ta prochaine rencontre</Text><Text style={ui.body}>Des idées de clubs à découvrir. Ces exemples sont des aperçus, sans date ni réservation ouverte.</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>{previews.map(p => <Pressable accessibilityRole="button" accessibilityLabel={`Découvrir l’aperçu : ${p.subtitle}`} key={p.id} onPress={() => router.push(`/experience/${p.id}` as Href)} style={[ui.card, { flexGrow: 1, flexBasis: 300, minHeight: 245, overflow: 'hidden', borderColor: `${p.color}55` }]}><TrailArt color={p.color}/><View style={ui.row}><Text style={[ui.eyebrow, { color: p.color, letterSpacing: 1, flex: 1 }]}>{p.eyebrow}</Text><Text style={[ui.chipText, { fontSize: 10 }]}>APERÇU</Text></View><Text style={[ui.title, { fontSize: 27, lineHeight: 33, marginVertical: 10 }]}>{p.title}</Text><Text style={{ color: p.color, fontSize: 14, fontWeight: '600' }}>{p.subtitle}</Text><Text style={ui.body}>{p.activity === 'walk' ? 'Marche' : 'Course facile'} · {p.duration} <Text style={{ color: p.color }}>↗</Text></Text></Pressable>)}</View></View>}
    <View style={[ui.card, { backgroundColor: '#263624' }]}><Text style={ui.eyebrow}>LE RENDEZ-VOUS, C’EST VOUS</Text><Text style={ui.heading}>Une envie à partager ?</Text><Text style={ui.body}>Rassemble un club autour d’une langue, d’un quartier ou d’un rituel. La première sortie peut être toute simple.</Text><Action label="Créer mon club" onPress={() => router.push('/(tabs)/club/create')}/><Action secondary label="Proposer une sortie" onPress={() => router.push('/outing/create' as Href)}/></View>
  </ScrollView></SafeAreaView>;
}
