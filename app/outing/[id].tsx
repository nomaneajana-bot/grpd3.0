import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createApiClient, getSession, getMySessions, joinSession, leaveSession } from '@/lib/api';
import { apiSessionToSessionData, type SessionData } from '@/lib/sessionData';
import { activityForSession, isSocialOuting, isUpcoming } from '@/lib/experiences';
import { removeJoinedSession, upsertJoinedSession } from '@/lib/joinedSessionsStore';
import { Action, Back, TrailArt, experienceTheme as t, ui } from '@/components/experiences/ExperienceUI';
export default function OutingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const saving = useRef(false);
  const load = useCallback(async () => {
    setLoading(true); setError(''); setSession(null); setJoined(false);
    try {
      const client = createApiClient();
      const [value, mine] = await Promise.all([getSession(client, id), getMySessions(client)]);
      if (!value) throw new Error('Outing not found');
      if (!isSocialOuting(value)) { router.replace(`/session/${id}` as Href); return; }
      // Access is checked by the API; approved members can open their club's outing.
      setSession(apiSessionToSessionData(value));
      setJoined(mine.sessions.some(s => s.id === id && (s.attendanceStatus === 'joined' || s.attendanceStatus === 'attended')));
    } catch { setError('Impossible de charger cette sortie et ton inscription. Réessaie.'); }
    finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const participate = async () => {
    if (saving.current || !session) return;
    saving.current = true; setBusy(true); setError('');
    try {
      if (joined) {
        await leaveSession(createApiClient(), id);
        setJoined(false); setConfirmLeave(false);
        await removeJoinedSession(id).catch(() => undefined);
      } else {
        const result = await joinSession(createApiClient(), id, session.experience ? {} : { groupId: 'C' });
        if (result.status !== 'joined') { setError('Ton inscription n’est pas encore confirmée. Actualise pour vérifier son état.'); return; }
        setJoined(true);
        await upsertJoinedSession(id, session.experience ? 'community' : 'C').catch(() => undefined);
      }
    } catch { setError('La modification n’a pas pu être confirmée. Actualise pour vérifier ton inscription avant de réessayer.'); }
    finally { saving.current = false; setBusy(false); }
  };
  return <SafeAreaView style={ui.safe}><ScrollView contentContainerStyle={ui.content}><Back onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}/>
    {loading ? <ActivityIndicator color={t.accent}/> : <>
      {session && <><Text style={ui.eyebrow}>{session.typeLabel} · GRATUIT</Text><View style={[ui.card, { overflow: 'hidden', minHeight: 190, justifyContent: 'center' }]}><TrailArt/><Text style={ui.title}>{session.title}</Text></View><Text style={ui.heading}>{session.dateLabel}</Text><Text style={ui.body}>{session.visibility === 'members' ? 'Sortie réservée aux membres du club' : 'Sortie publique'}</Text><Text style={ui.body}>{session.spot}</Text>
        <View style={ui.card}><Text style={ui.eyebrow}>LA SORTIE EN QUELQUES MOTS</Text>{session.experience?.format === 'language' && <Text style={ui.body}>{session.experience.language} · {session.experience.level}</Text>}<Text style={ui.body}>{session.coachAdvice || 'Le programme sera précisé par l’hôte.'}</Text><View style={ui.row}><Text style={ui.body}>{session.volume}</Text><Text style={ui.body}>{activityForSession(session) === 'walk' ? 'Marche tranquille' : 'Course facile'}</Text></View><Text style={ui.body}>Allure de conversation · Participation gratuite</Text></View>
        <View style={ui.card}><Text style={ui.eyebrow}>TON RENDEZ-VOUS</Text><Text style={ui.heading}>{session.coachName ? `Avec ${session.coachName}` : 'Hôte à préciser'}</Text><Text style={ui.body}>{session.meetingPoint || session.spot}</Text></View>
        {joined && <Text style={[ui.body, { color: t.accent }]}>Tu es inscrit·e. Retrouve cette sortie dans « Mes sorties ».</Text>}
        {isUpcoming(session) ? confirmLeave ? <View style={ui.card}><Text style={ui.body}>Annuler ta participation à cette sortie ?</Text><Action disabled={busy} label={busy ? 'Annulation…' : 'Confirmer mon annulation'} onPress={() => void participate()}/><Action disabled={busy} secondary label="Garder ma place" onPress={() => setConfirmLeave(false)}/></View> : <Action disabled={busy} secondary={joined} label={busy ? 'Inscription…' : joined ? 'Annuler ma participation' : 'Rejoindre la sortie gratuitement'} onPress={() => joined ? setConfirmLeave(true) : void participate()}/> : <Text style={ui.body}>Cette sortie est terminée.</Text>}
        <Action secondary label="Mes sorties" onPress={() => router.push('/(tabs)/my-sessions')}/></>}
      {error ? <Text accessibilityRole="alert" style={ui.error}>{error}</Text> : null}<Action disabled={busy} secondary label="Actualiser" onPress={() => void load()}/>
    </>}
  </ScrollView></SafeAreaView>;
}
