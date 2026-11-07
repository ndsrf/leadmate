import { createTranslator } from '../i18n';
import { newDogRecord } from './dogRecord';
import { findLesson } from './lessons/content';
import { lessonTextKeys } from './lessons/lesson';
import {
  isPuppyModuleCompleted,
  isPuppyModuleId,
  isPuppyRecord,
  markPuppyModuleCompleted,
  PUPPY_BITE_ID,
  PUPPY_LESSONS,
  PUPPY_MODULE_IDS,
  PUPPY_SATELLITE_STOPS,
  PUPPY_SOUND_ID,
  PUPPY_VET_ID,
  satelliteStopForParent,
} from './puppyTrack';

const t = createTranslator();

describe('puppyTrack', () => {
  describe('module identifiers and checks', () => {
    it('defines the three companion module IDs', () => {
      expect(PUPPY_MODULE_IDS).toEqual([PUPPY_BITE_ID, PUPPY_SOUND_ID, PUPPY_VET_ID]);
    });

    it('identifies valid puppy module IDs', () => {
      expect(isPuppyModuleId('puppy-bite')).toBe(true);
      expect(isPuppyModuleId('puppy-sound')).toBe(true);
      expect(isPuppyModuleId('puppy-vet')).toBe(true);
      expect(isPuppyModuleId('theory-home-rest')).toBe(false);
      expect(isPuppyModuleId('random')).toBe(false);
    });

    it('identifies puppy records exclusively by ageBand === "puppy"', () => {
      expect(isPuppyRecord({ ageBand: 'puppy' })).toBe(true);
      expect(isPuppyRecord({ ageBand: 'adolescent' })).toBe(false);
      expect(isPuppyRecord({ ageBand: 'adult' })).toBe(false);
      expect(isPuppyRecord({ ageBand: 'senior' })).toBe(false);
      expect(isPuppyRecord({ ageBand: null })).toBe(false);
    });
  });

  describe('completion progress', () => {
    it('tracks completion via readLessons', () => {
      const record = newDogRecord();
      expect(isPuppyModuleCompleted(record, 'puppy-bite')).toBe(false);

      const updated = markPuppyModuleCompleted(record, 'puppy-bite');
      expect(isPuppyModuleCompleted(updated, 'puppy-bite')).toBe(true);
      expect(updated.readLessons).toContain('puppy-bite');

      // idempotent: marking again does not duplicate
      const again = markPuppyModuleCompleted(updated, 'puppy-bite');
      expect(again.readLessons.filter((id) => id === 'puppy-bite')).toHaveLength(1);
    });
  });

  describe('satellite stop anchoring configuration', () => {
    it('defines satellite stops for the three foundational World 1 stretches', () => {
      expect(PUPPY_SATELLITE_STOPS).toHaveLength(3);

      expect(PUPPY_SATELLITE_STOPS[0]).toMatchObject({
        id: 'puppy-bite',
        lessonId: 'puppy-bite',
        parentStopId: 'dog-as-dog',
        stretchIndex: 0,
      });

      expect(PUPPY_SATELLITE_STOPS[1]).toMatchObject({
        id: 'puppy-sound',
        lessonId: 'puppy-sound',
        parentStopId: 'theory-home-rest',
        stretchIndex: 1,
      });

      expect(PUPPY_SATELLITE_STOPS[2]).toMatchObject({
        id: 'puppy-vet',
        lessonId: 'puppy-vet',
        parentStopId: 'theory-calm-first',
        stretchIndex: 2,
      });
    });

    it('retrieves satellite stop definition by parent stop ID', () => {
      expect(satelliteStopForParent('dog-as-dog')?.id).toBe('puppy-bite');
      expect(satelliteStopForParent('theory-home-rest')?.id).toBe('puppy-sound');
      expect(satelliteStopForParent('theory-calm-first')?.id).toBe('puppy-vet');
      expect(satelliteStopForParent('unknown')).toBeUndefined();
    });
  });

  describe('lesson definitions and catalog completeness', () => {
    it('registers the 3 puppy lessons in the Theory Library via findLesson', () => {
      for (const id of PUPPY_MODULE_IDS) {
        const lesson = findLesson(id);
        expect(lesson).toBeDefined();
        expect(lesson?.id).toBe(id);
        expect(lesson?.kind).toBe('theory');
      }
    });

    it('provides non-empty catalog text for all text keys in every puppy lesson', () => {
      for (const lesson of PUPPY_LESSONS) {
        expect(t(lesson.title)).toBeTruthy();
        const keys = lessonTextKeys(lesson.blocks);
        expect(keys.length).toBeGreaterThan(10);
        for (const key of keys) {
          const text = t(key);
          expect(text).toBeTruthy();
          expect(text.trim().length).toBeGreaterThan(0);
        }
      }
    });
  });
});
