import { payloadWith } from '../testPayload';
import {
  CLEAN_MAX_PULL,
  KEEP_SLACK_MAX_PULL,
  pawsFor,
  type EncounterAim,
  type PawReason,
} from './encounters';

describe('Encounter constants', () => {
  it('defines the decided pull thresholds', () => {
    expect(KEEP_SLACK_MAX_PULL).toBe(25);
    expect(CLEAN_MAX_PULL).toBe(10);
  });
});

describe('pawsFor table tests', () => {
  describe('Encounter Aims (1 Paw when missed, next: "aim")', () => {
    const cases: {
      name: string;
      aim: EncounterAim;
      payload: ReturnType<typeof payloadWith>;
      aimMet: boolean;
    }[] = [
      {
        name: 'keep-slack met when pull <= 25 and not reactive',
        aim: 'keep-slack',
        payload: payloadWith({ pullPercentage: 20, peakReactionTier: 'alert' }),
        aimMet: true,
      },
      {
        name: 'keep-slack missed when pull > 25',
        aim: 'keep-slack',
        payload: payloadWith({ pullPercentage: 26, peakReactionTier: 'calm' }),
        aimMet: false,
      },
      {
        name: 'keep-slack missed when Dog reactive even if pull <= 25',
        aim: 'keep-slack',
        payload: payloadWith({ pullPercentage: 15, peakReactionTier: 'reactive' }),
        aimMet: false,
      },
      {
        name: 'stay-calm met when peakReactionTier is calm or alert',
        aim: 'stay-calm',
        payload: payloadWith({ peakReactionTier: 'alert', pullPercentage: 15 }),
        aimMet: true,
      },
      {
        name: 'stay-calm missed when peakReactionTier is reactive',
        aim: 'stay-calm',
        payload: payloadWith({ peakReactionTier: 'reactive' }),
        aimMet: false,
      },
      {
        name: 'mark-disengagement met when markerHits >= 1',
        aim: 'mark-disengagement',
        payload: payloadWith({ markerHits: 1, markGrades: { perfect: 1, good: 0, late: 0 } }),
        aimMet: true,
      },
      {
        name: 'mark-disengagement missed when markerHits === 0',
        aim: 'mark-disengagement',
        payload: payloadWith({ markerHits: 0, missedOpportunities: 1 }),
        aimMet: false,
      },
      {
        name: 'check-in met when checkInHits >= 1',
        aim: 'check-in',
        payload: payloadWith({ checkInHits: 1, markGrades: { perfect: 1, good: 0, late: 0 } }),
        aimMet: true,
      },
      {
        name: 'check-in missed when checkInHits === 0',
        aim: 'check-in',
        payload: payloadWith({ checkInHits: 0 }),
        aimMet: false,
      },
    ];

    cases.forEach(({ name, aim, payload, aimMet }) => {
      it(name, () => {
        const result = pawsFor(aim, payload);
        if (!aimMet) {
          expect(result).toEqual({ paws: 1, next: 'aim' });
        } else {
          expect(result.paws).toBeGreaterThanOrEqual(2);
        }
      });
    });
  });

  describe('Clean result and next condition priority', () => {
    const table: {
      desc: string;
      aim: EncounterAim;
      payload: ReturnType<typeof payloadWith>;
      expectedPaws: 1 | 2 | 3;
      expectedNext: PawReason | null;
    }[] = [
      // 3 Paws clean scenarios
      {
        desc: 'keep-slack clean: pull <= 10, not reactive, no reactive markers, no late',
        aim: 'keep-slack',
        payload: payloadWith({
          pullPercentage: 8,
          peakReactionTier: 'calm',
          reactiveMarkers: 0,
          markGrades: { perfect: 0, good: 0, late: 0 },
        }),
        expectedPaws: 3,
        expectedNext: null,
      },
      {
        desc: 'stay-calm clean: not reactive, pull <= 10, no reactive markers, no late',
        aim: 'stay-calm',
        payload: payloadWith({
          pullPercentage: 5,
          peakReactionTier: 'alert',
          reactiveMarkers: 0,
          markGrades: { perfect: 0, good: 0, late: 0 },
        }),
        expectedPaws: 3,
        expectedNext: null,
      },
      {
        desc: 'mark-disengagement clean: markerHits >= 1, perfect >= 1, pull <= 10, not reactive, no reactive markers, no late',
        aim: 'mark-disengagement',
        payload: payloadWith({
          markerHits: 1,
          pullPercentage: 4,
          peakReactionTier: 'calm',
          reactiveMarkers: 0,
          markGrades: { perfect: 1, good: 0, late: 0 },
        }),
        expectedPaws: 3,
        expectedNext: null,
      },
      {
        desc: 'check-in clean: checkInHits >= 1, perfect >= 1 (check-in counts toward perfect), pull <= 10, not reactive, no reactive markers, no late',
        aim: 'check-in',
        payload: payloadWith({
          checkInHits: 1,
          pullPercentage: 0,
          peakReactionTier: 'calm',
          reactiveMarkers: 0,
          markGrades: { perfect: 1, good: 0, late: 0 },
        }),
        expectedPaws: 3,
        expectedNext: null,
      },
      // 2 Paws scenarios with priority of unmet conditions:
      // 1: reactive (for mark aims where aim is met despite reactive)
      {
        desc: 'mark aim met, but Dog reached reactive -> next: reactive',
        aim: 'mark-disengagement',
        payload: payloadWith({
          markerHits: 1,
          peakReactionTier: 'reactive',
          pullPercentage: 5,
          reactiveMarkers: 0,
          markGrades: { perfect: 1, good: 0, late: 0 },
        }),
        expectedPaws: 2,
        expectedNext: 'reactive',
      },
      // 2: pull > 10 (when not reactive)
      {
        desc: 'stay-calm met, not reactive, but pull > 10 (15%) -> next: pull',
        aim: 'stay-calm',
        payload: payloadWith({
          peakReactionTier: 'calm',
          pullPercentage: 15,
          reactiveMarkers: 0,
          markGrades: { perfect: 0, good: 0, late: 0 },
        }),
        expectedPaws: 2,
        expectedNext: 'pull',
      },
      // 3: reactive marker > 0 (when pull <= 10 and not reactive)
      {
        desc: 'mark-disengagement met, pull <= 10, not reactive, but reactiveMarkers > 0 -> next: reactive-marker',
        aim: 'mark-disengagement',
        payload: payloadWith({
          markerHits: 1,
          peakReactionTier: 'alert',
          pullPercentage: 5,
          reactiveMarkers: 1,
          markGrades: { perfect: 1, good: 0, late: 0 },
        }),
        expectedPaws: 2,
        expectedNext: 'reactive-marker',
      },
      // 4: late press > 0 (when reactiveMarkers === 0, pull <= 10, not reactive)
      {
        desc: 'check-in met, pull <= 10, not reactive, no reactiveMarkers, but late press > 0 -> next: late',
        aim: 'check-in',
        payload: payloadWith({
          checkInHits: 1,
          peakReactionTier: 'calm',
          pullPercentage: 5,
          reactiveMarkers: 0,
          markGrades: { perfect: 1, good: 0, late: 1 },
        }),
        expectedPaws: 2,
        expectedNext: 'late',
      },
      // 5: perfect mark missing for mark aims (when all other clean conditions met)
      {
        desc: 'mark-disengagement met with Good only (no perfect) -> next: perfect',
        aim: 'mark-disengagement',
        payload: payloadWith({
          markerHits: 1,
          peakReactionTier: 'calm',
          pullPercentage: 5,
          reactiveMarkers: 0,
          markGrades: { perfect: 0, good: 1, late: 0 },
        }),
        expectedPaws: 2,
        expectedNext: 'perfect',
      },
      {
        desc: 'check-in met with Good only (no perfect) -> next: perfect',
        aim: 'check-in',
        payload: payloadWith({
          checkInHits: 1,
          peakReactionTier: 'calm',
          pullPercentage: 5,
          reactiveMarkers: 0,
          markGrades: { perfect: 0, good: 1, late: 0 },
        }),
        expectedPaws: 2,
        expectedNext: 'perfect',
      },
    ];

    table.forEach(({ desc, aim, payload, expectedPaws, expectedNext }) => {
      it(desc, () => {
        expect(pawsFor(aim, payload)).toEqual({ paws: expectedPaws, next: expectedNext });
      });
    });
  });

  describe('Reproducibility', () => {
    it('gives the exact same result for the same payload', () => {
      const p = payloadWith({
        markerHits: 1,
        pullPercentage: 8,
        peakReactionTier: 'calm',
        reactiveMarkers: 0,
        markGrades: { perfect: 1, good: 0, late: 0 },
      });
      const r1 = pawsFor('mark-disengagement', p);
      const r2 = pawsFor('mark-disengagement', p);
      expect(r1).toEqual(r2);
    });
  });
});
