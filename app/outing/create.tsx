import React, { useRef, useState } from 'react';
import { ScrollView, Text, TextInput, View, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createApiClient, createCommunityOuting } from '@/lib/api';
import { EXPERIENCE_PREVIEWS, parseOutingDate } from '@/lib/experiences';
import { Action, Back, experienceTheme as t, ui } from '@/components/experiences/ExperienceUI';

export default function CreateOutingScreen() {
  const { template, clubId } = useLocalSearchParams<{ template?: string; clubId?: string }>();
  const idea = EXPERIENCE_PREVIEWS.find(p => p.id === template);
  const [category, setCategory] = useState<'community' | 'language'>(idea?.category === 'language' ? 'language' : 'community');
  const [activity, setActivity] = useState<'walk' | 'run'>(idea?.activity ?? 'walk');
  const [title, setTitle] = useState(idea?.subtitle ?? '');
  const [host, setHost] = useState('');
  const [spot, setSpot] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [language, setLanguage] = useState(idea?.id === 'english' ? 'Anglais' : idea?.id === 'french-run' ? 'Français' : '');
  const [level, setLevel] = useState('Tous niveaux');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [error, setError] = useState('');
  const publish = async () => {
    if (saving.current) return;
    setError('');
    const parsed = parseOutingDate(date.trim(), time.trim());
    if (!title.trim() || !host.trim() || !spot.trim() || !description.trim()) { setError('Ajoute le titre, ton nom, le rendez-vous et le programme.'); return; }
    if (!parsed) { setError('Choisis une date et une heure futures valides : AAAA-MM-JJ et HH:MM.'); return; }
    const minutes = Number(duration);
    if (!Number.isInteger(minutes) || minutes < 15 || minutes > 240) { setError('Choisis une durée entre 15 et 240 minutes.'); return; }
    if (category === 'language' && (!language.trim() || !level.trim())) { setError('Précise la langue à pratiquer et le niveau de conversation.'); return; }
    saving.current = true; setBusy(true);
    try {
      const base = {kind: 'community' as const, activity, durationMinutes: minutes};
      const result = await createCommunityOuting(createApiClient(), {
        title: title.trim(), meetingPoint: spot.trim(), hostName: host.trim(), programme: description.trim(),
        dateISO: new Date(`${date.trim()}T${time.trim()}:00`).toISOString(), clubId: clubId || null,
        experience: category === 'language' ? {...base, format: 'language', language: language.trim(), level: level.trim()} : {...base, format: 'open'},
      });
      router.replace(`/outing/${result.id}` as Href);
    } catch { setError('La sortie n’a pas été publiée. Vérifie ta connexion et réessaie.'); }
    finally { saving.current = false; setBusy(false); }
  };
  const field = (label: string, value: string, onChangeText: (v: string) => void, placeholder: string, multiline = false) => <View><Text style={ui.label}>{label}</Text><TextInput accessibilityLabel={label} style={[ui.input, multiline && { minHeight: 120, textAlignVertical: 'top' }]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={t.muted} multiline={multiline} editable={!busy}/></View>;
  return <SafeAreaView style={ui.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}>
    <Back onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}/><Text style={ui.eyebrow}>DONNE RENDEZ-VOUS</Text><Text style={ui.title}>Une sortie simple.{'\n'}Une bonne compagnie.</Text><Text style={ui.body}>{clubId ? 'Cette sortie appartient au club et reprend sa visibilité.' : 'Propose une sortie publique et gratuite.'} Les participants choisissent de te rejoindre. Tu peux préciser la ville, le point de départ et le programme ci-dessous.</Text>
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>{(['community', 'language'] as const).map(c => <Pressable disabled={busy} accessibilityRole="button" accessibilityState={{ selected: category === c }} key={c} style={[ui.chip, category === c && ui.chipOn]} onPress={() => setCategory(c)}><Text style={[ui.chipText, category === c && { color: t.bg }]}>{c === 'community' ? 'Se retrouver' : 'Pratiquer une langue'}</Text></Pressable>)}</View>
    <View style={{ flexDirection: 'row', gap: 8 }}>{(['walk', 'run'] as const).map(a => <Pressable disabled={busy} accessibilityRole="button" accessibilityState={{ selected: activity === a }} key={a} style={[ui.chip, activity === a && ui.chipOn]} onPress={() => setActivity(a)}><Text style={[ui.chipText, activity === a && { color: t.bg }]}>{a === 'walk' ? 'Marche' : 'Course facile'}</Text></Pressable>)}</View>
    {field('Nom de la sortie', title, setTitle, 'Une marche pour se retrouver')}{field('Ton nom, affiché comme hôte', host, setHost, 'Ton prénom')}{field('Ville et point de rendez-vous', spot, setSpot, 'Casablanca · entrée du parc…')}
    {field('Date (AAAA-MM-JJ)', date, setDate, 'AAAA-MM-JJ')}{field('Heure locale (HH:MM)', time, setTime, '08:30')}{field('Durée en minutes', duration, setDuration, '60')}
    {category === 'language' && <>{field('Langue à pratiquer', language, setLanguage, 'Anglais, français, darija…')}{field('Niveau de conversation', level, setLevel, 'Débutants, intermédiaires…')}</>}
    {field('Le programme et les informations pratiques', description, setDescription, 'Le sujet du jour, la langue des consignes, le parcours, les pauses et ce qu’il faut apporter…', true)}
    <Text style={ui.body}>Une allure qui permet de discuter. Pour une sortie après Fajr, confirme l’heure de départ pour la date choisie.</Text>
    {error ? <Text accessibilityRole="alert" style={ui.error}>{error}</Text> : null}<Action disabled={busy} label={busy ? 'Publication…' : 'Publier ma sortie gratuite'} onPress={() => void publish()}/>
    <Action secondary label="Créer une séance d’entraînement" disabled={busy} onPress={() => router.push('/session/create')}/>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
