// Unit tests for sessionBuilder.ts

import { buildSessionFromForm } from '../sessionBuilder';
import type { SessionGroupConfig } from '../sessionBuilder';
import { todayISO } from '../dateHelpers';

function futureISO(daysAhead = 2): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

describe('sessionBuilder', () => {
  const mockGroupConfigs: SessionGroupConfig[] = [
    { id: 'A', isActive: true, paceSecondsPerKm: 255, reps: null, effortDurationSeconds: null, effortDistanceKm: null, recoveryDurationSeconds: null },
    { id: 'B', isActive: true, paceSecondsPerKm: 285, reps: null, effortDurationSeconds: null, effortDistanceKm: null, recoveryDurationSeconds: null },
    { id: 'C', isActive: false, paceSecondsPerKm: null, reps: null, effortDurationSeconds: null, effortDistanceKm: null, recoveryDurationSeconds: null },
    { id: 'D', isActive: false, paceSecondsPerKm: null, reps: null, effortDurationSeconds: null, effortDistanceKm: null, recoveryDurationSeconds: null },
  ];

  it('should create session with correct structure', () => {
    const result = buildSessionFromForm({
      spot: 'Marina',
      dateISO: futureISO(),
      timeLabel: '06:00',
      sessionType: 'FARTLEK',
      groupConfigs: mockGroupConfigs,
    });

    expect(result.session.id).toMatch(/^custom-/);
    expect(result.session.title).toBe('FARTLEK');
    expect(result.session.spot).toBe('Marina');
    expect(result.session.typeLabel).toBe('FARTLEK');
    expect(result.session.isCustom).toBe(true);
    expect(result.session.paceGroups.length).toBe(2); // Only active groups
    expect(result.session.dateISO).toBeDefined();
    expect(result.session.timeMinutes).toBeDefined();
  });

  it('should generate dateISO and timeMinutes', () => {
    // Use a future slot — today 06:00 fails once wall-clock passes 06:00.
    const result = buildSessionFromForm({
      spot: 'Marina',
      dateISO: futureISO(1),
      timeLabel: '18:30',
      sessionType: 'FARTLEK',
      groupConfigs: mockGroupConfigs,
    });

    expect(result.session.dateISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.session.timeMinutes).toBe(18 * 60 + 30);
  });

  it('should set recommendedGroupId to C by default when C active', () => {
    const withC: SessionGroupConfig[] = mockGroupConfigs.map((g) =>
      g.id === 'C'
        ? { ...g, isActive: true, paceSecondsPerKm: 330 }
        : g,
    );
    const result = buildSessionFromForm({
      spot: 'Marina',
      dateISO: futureISO(),
      timeLabel: '06:00',
      sessionType: 'FARTLEK',
      groupConfigs: withC,
    });

    expect(result.defaultGroupId).toBe('C');
    expect(result.session.recommendedGroupId).toBe('C');
  });

  it('should include workoutId when provided', () => {
    const result = buildSessionFromForm({
      spot: 'Marina',
      dateISO: futureISO(),
      timeLabel: '06:00',
      sessionType: 'FARTLEK',
      groupConfigs: mockGroupConfigs,
      workoutId: 'workout-123',
    });

    expect(result.session.workoutId).toBe('workout-123');
  });

  it('should create paceGroupsOverride for active groups', () => {
    const result = buildSessionFromForm({
      spot: 'Marina',
      dateISO: futureISO(),
      timeLabel: '06:00',
      sessionType: 'FARTLEK',
      groupConfigs: mockGroupConfigs,
    });

    expect(result.session.paceGroupsOverride).toBeDefined();
    expect(result.session.paceGroupsOverride!.length).toBe(2);
    expect(result.session.paceGroupsOverride!.every(g => g.isActive)).toBe(true);
  });

  it('should reject past dates', () => {
    expect(() =>
      buildSessionFromForm({
        spot: 'Marina',
        dateISO: '2020-01-01',
        timeLabel: '06:00',
        sessionType: 'FARTLEK',
        groupConfigs: mockGroupConfigs,
      }),
    ).toThrow(/PAST_DATE/);
  });

  it('should not invent 10km or 5:00 pace for walks without groups', () => {
    const result = buildSessionFromForm({
      spot: 'Corniche',
      dateISO: futureISO(),
      timeLabel: '18:00',
      sessionType: 'MARCHE',
      groupConfigs: [],
    });

    expect(result.session.estimatedDistanceKm).toBe(0);
    expect(result.session.targetPace).toBe('Allure libre');
    expect(result.session.volume).toMatch(/Marche/i);
    expect(result.session.paceGroups).toEqual([]);
    expect(result.defaultGroupId).toBe('open');
  });

  it('uses structureNotes as volume for any session type', () => {
    const notes = '10 min easy · 6x1 min / 1 min · cool-down';
    const result = buildSessionFromForm({
      spot: 'Marina',
      dateISO: futureISO(),
      timeLabel: '18:00',
      sessionType: 'STRUCTURÉ',
      groupConfigs: mockGroupConfigs,
      structureNotes: notes,
    });
    expect(result.session.volume).toBe(notes);
    expect(result.session.typeLabel).toBe('STRUCTURÉ');
  });

  it('keeps title and purpose for workout / libre / découverte (same as marche)', () => {
    for (const sessionType of ['STRUCTURÉ', 'COURSE LIBRE', 'DÉCOUVERTE'] as const) {
      const result = buildSessionFromForm({
        spot: 'Marina',
        dateISO: futureISO(),
        timeLabel: '18:00',
        sessionType,
        groupConfigs: sessionType === 'STRUCTURÉ' ? mockGroupConfigs : [],
        title: `Titre ${sessionType}`,
        purpose: `Objectif ${sessionType}`,
        structureNotes: `Déroulé ${sessionType}`,
      });
      expect(result.session.title).toBe(`Titre ${sessionType}`);
      expect(result.session.coachAdvice).toBe(`Objectif ${sessionType}`);
      expect(result.session.volume).toBe(`Déroulé ${sessionType}`);
    }
  });

  it('uses user title and purpose; language only when provided', () => {
    const withLang = buildSessionFromForm({
      spot: 'Phare Corniche',
      dateISO: futureISO(),
      timeLabel: '09:00',
      sessionType: 'MARCHE',
      groupConfigs: [],
      title: 'English by the sea',
      purpose: 'Une marche pour pratiquer, à ton rythme.',
      language: 'Anglais',
    });
    expect(withLang.session.title).toBe('English by the sea');
    expect(withLang.session.typeLabel).toBe('LANGUES · MARCHE');
    expect(withLang.session.volume).toBe('Anglais');
    expect(withLang.session.coachAdvice).toMatch(/pratiquer/);
    expect(withLang.session.experience?.format).toBe('language');

    const noLang = buildSessionFromForm({
      spot: 'Phare Corniche',
      dateISO: futureISO(),
      timeLabel: '09:00',
      sessionType: 'MARCHE',
      groupConfigs: [],
      title: 'Marche du dimanche',
      purpose: 'Balade tranquille',
    });
    expect(noLang.session.typeLabel).toBe('MARCHE');
    expect(noLang.session.volume).not.toMatch(/English|Anglais/i);
    expect(noLang.session.experience?.format).toBe('community');
  });
});
