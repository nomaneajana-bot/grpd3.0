// Unit tests for storageSchemas.ts

import {
  validateSessionData,
  validateWorkoutEntity,
  validateTestRecord,
  validateJoinedSession,
} from '../storageSchemas';
import type { SessionData } from '../sessionData';
import type { WorkoutEntity } from '../workoutStore';
import type { TestRecord } from '../profileStore';
import type { JoinedSession } from '../joinedSessionsStore';

describe('storageSchemas', () => {
  describe('validateSessionData', () => {
    const validSession: Partial<SessionData> = {
      id: 'test-1',
      title: 'Test Session',
      spot: 'Marina',
      dateLabel: 'LUNDI 10 NOVEMBRE 06:00',
      typeLabel: 'FARTLEK',
      volume: 'Test volume',
      targetPace: '5:00/km',
      recommendedGroupId: 'B',
      estimatedDistanceKm: 10,
      paceGroups: [],
    };

    it('should validate correct session data', () => {
      const result = validateSessionData(validSession);
      expect(result).not.toBeNull();
      expect(result!.id).toBe('test-1');
    });

    it('should reject invalid session data', () => {
      expect(validateSessionData(null)).toBeNull();
      expect(validateSessionData({})).toBeNull();
      expect(validateSessionData({ ...validSession, id: 123 })).toBeNull();
    });

    it('should validate dateISO format', () => {
      const withInvalidDate = { ...validSession, dateISO: 'invalid' };
      expect(validateSessionData(withInvalidDate)).toBeNull();

      const withValidDate = { ...validSession, dateISO: '2025-11-10' };
      expect(validateSessionData(withValidDate)).not.toBeNull();
    });

    it('should validate timeMinutes range', () => {
      const withInvalidTime = { ...validSession, timeMinutes: 2000 };
      expect(validateSessionData(withInvalidTime)).toBeNull();

      const withValidTime = { ...validSession, timeMinutes: 360 };
      expect(validateSessionData(withValidTime)).not.toBeNull();
    });
  });

  describe('validateWorkoutEntity', () => {
    const validWorkout: Partial<WorkoutEntity> = {
      id: 'workout-1',
      name: 'Test Workout',
      runType: 'fartlek',
      createdAt: Date.now(),
      isCustom: true,
      workout: {
        id: 'workout-1-workout',
        title: 'Test Workout',
      },
    };

    it('should validate correct workout data', () => {
      const result = validateWorkoutEntity(validWorkout);
      expect(result).not.toBeNull();
    });

    it('should reject invalid workout data', () => {
      expect(validateWorkoutEntity(null)).toBeNull();
      expect(validateWorkoutEntity({})).toBeNull();
      expect(validateWorkoutEntity({ ...validWorkout, id: 123 })).toBeNull();
    });
  });

  describe('validateTestRecord', () => {
    const validTest: Partial<TestRecord> = {
      id: 'test-1',
      kind: 'distance',
      label: '5 km',
      distanceMeters: 5000,
      durationSeconds: 1200,
      paceSecondsPerKm: 240,
    };

    it('should validate correct test record', () => {
      const result = validateTestRecord(validTest);
      expect(result).not.toBeNull();
    });

    it('should reject invalid test record', () => {
      expect(validateTestRecord(null)).toBeNull();
      expect(validateTestRecord({})).toBeNull();
      expect(validateTestRecord({ ...validTest, kind: 'invalid' })).toBeNull();
    });
  });

  describe('validateJoinedSession', () => {
    const validJoined: Partial<JoinedSession> = {
      sessionId: 'session-1',
      groupId: 'B',
    };

    it('should validate correct joined session', () => {
      const result = validateJoinedSession(validJoined);
      expect(result).not.toBeNull();
    });

    it('should reject invalid groupId', () => {
      expect(validateJoinedSession({ ...validJoined, groupId: 'E' })).toBeNull();
      expect(validateJoinedSession({ ...validJoined, groupId: 'invalid' })).toBeNull();
    });

    it('should reject invalid data', () => {
      expect(validateJoinedSession(null)).toBeNull();
      expect(validateJoinedSession({})).toBeNull();
    });
  });
});
