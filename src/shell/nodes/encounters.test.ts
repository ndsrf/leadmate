import { payloadWith } from '../testPayload';
import {
  CLEAN_MAX_PULL,
  KEEP_SLACK_MAX_PULL,
  combineEncounterPayloads,
  keptAttempt,
  pawsFor,
  type EncounterAim,
  type EncounterAttempt,
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

describe('keptAttempt', () => {
  it('keeps the attempt with the most Paws (1, 3, 2 keeps the second)', () => {
    const a1: EncounterAttempt = { paws: 1, payload: payloadWith({ seed: 101 }) };
    const a2: EncounterAttempt = { paws: 3, payload: payloadWith({ seed: 102 }) };
    const a3: EncounterAttempt = { paws: 2, payload: payloadWith({ seed: 103 }) };
    expect(keptAttempt([a1, a2, a3])).toBe(a2);
  });

  it('keeps the latest attempt on ties (2, 2 keeps the second)', () => {
    const a1: EncounterAttempt = { paws: 2, payload: payloadWith({ seed: 201 }) };
    const a2: EncounterAttempt = { paws: 2, payload: payloadWith({ seed: 202 }) };
    expect(keptAttempt([a1, a2])).toBe(a2);
  });

  it('returns null for empty attempts', () => {
    expect(keptAttempt([])).toBeNull();
  });
});

describe('combineEncounterPayloads', () => {
  it('weights tension shares by duration: 10 s at 0% pull + 20 s at 30% pull gives 20% pull, summing to 100', () => {
    const e1: EncounterAttempt = {
      paws: 3,
      payload: payloadWith({ durationSeconds: 10, pullPercentage: 0, tautPercentage: 0, slackPercentage: 100 }),
    };
    const e2: EncounterAttempt = {
      paws: 2,
      payload: payloadWith({ durationSeconds: 20, pullPercentage: 30, tautPercentage: 10, slackPercentage: 60 }),
    };
    const combined = combineEncounterPayloads([{ id: 'enc1', attempts: [e1] }, { id: 'enc2', attempts: [e2] }]);
    expect(combined.durationSeconds).toBe(30);
    expect(combined.pullPercentage).toBe(20);
    expect(combined.slackPercentage + combined.tautPercentage + combined.pullPercentage).toBe(100);
  });

  it('sums counts and markGrades', () => {
    const e1: EncounterAttempt = {
      paws: 3,
      payload: payloadWith({
        markerHits: 2,
        markerMisses: 1,
        reactiveMarkers: 0,
        missedOpportunities: 1,
        checkInHits: 1,
        followMarks: 1,
        posteSuccesses: 1,
        harshStops: 0,
        marksUsed: 3,
        markBudget: 3,
        sintoniaTimeSeconds: 4.5,
        goSniffs: 1,
        markGrades: { perfect: 1, good: 1, late: 0 },
        calmEncounters: { skateboard: 1 },
      }),
    };
    const e2: EncounterAttempt = {
      paws: 2,
      payload: payloadWith({
        markerHits: 1,
        markerMisses: 0,
        reactiveMarkers: 1,
        missedOpportunities: 0,
        checkInHits: 2,
        followMarks: 0,
        posteSuccesses: 2,
        harshStops: 1,
        marksUsed: 2,
        markBudget: 4,
        sintoniaTimeSeconds: 3.2,
        goSniffs: 0,
        markGrades: { perfect: 1, good: 0, late: 1 },
        calmEncounters: { skateboard: 1, child: 1 },
      }),
    };
    const combined = combineEncounterPayloads([{ id: 'a', attempts: [e1] }, { id: 'b', attempts: [e2] }]);
    expect(combined.markerHits).toBe(3);
    expect(combined.markerMisses).toBe(1);
    expect(combined.reactiveMarkers).toBe(1);
    expect(combined.missedOpportunities).toBe(1);
    expect(combined.checkInHits).toBe(3);
    expect(combined.followMarks).toBe(1);
    expect(combined.posteSuccesses).toBe(3);
    expect(combined.harshStops).toBe(1);
    expect(combined.marksUsed).toBe(5);
    expect(combined.markBudget).toBe(7);
    expect(combined.sintoniaTimeSeconds).toBe(7.7);
    expect(combined.goSniffs).toBe(1);
    expect(combined.markGrades).toEqual({ perfect: 2, good: 1, late: 1 });
    expect(combined.calmEncounters).toEqual({ skateboard: 2, child: 1 });
  });

  it('takes the maximum for peakArousalScore and peakReactionTier', () => {
    const e1: EncounterAttempt = {
      paws: 2,
      payload: payloadWith({ peakArousalScore: 45, peakReactionTier: 'alert' }),
    };
    const e2: EncounterAttempt = {
      paws: 1,
      payload: payloadWith({ peakArousalScore: 88, peakReactionTier: 'reactive' }),
    };
    const combined = combineEncounterPayloads([{ id: 'a', attempts: [e1] }, { id: 'b', attempts: [e2] }]);
    expect(combined.peakArousalScore).toBe(88);
    expect(combined.peakReactionTier).toBe('reactive');
  });

  it('computes mean markerAccuracyMs or leaves it absent when none had it', () => {
    const e1: EncounterAttempt = {
      paws: 3,
      payload: payloadWith({ markerAccuracyMs: 250 }),
    };
    const e2: EncounterAttempt = {
      paws: 2,
      payload: payloadWith({ markerAccuracyMs: 310 }),
    };
    const combined = combineEncounterPayloads([{ id: 'a', attempts: [e1] }, { id: 'b', attempts: [e2] }]);
    expect(combined.markerAccuracyMs).toBe(280);

    const noAccuracy = combineEncounterPayloads([
      { id: 'a', attempts: [{ paws: 1, payload: payloadWith({ markerAccuracyMs: undefined }) }] },
    ]);
    expect('markerAccuracyMs' in noAccuracy).toBe(false);
  });

  it('scores handlingScore as 1000 / 667 / 833 / 917 for the spec Paw sets in a 4-encounter series', () => {
    const mk = (paws: 1 | 2 | 3): EncounterAttempt => ({ paws, payload: payloadWith() });

    // 3, 3, 3, 3 -> 1000
    const s1 = combineEncounterPayloads([
      { id: '1', attempts: [mk(3)] },
      { id: '2', attempts: [mk(3)] },
      { id: '3', attempts: [mk(3)] },
      { id: '4', attempts: [mk(3)] },
    ]);
    expect(s1.handlingScore).toBe(1000);

    // 2, 2, 2, 2 -> 667
    const s2 = combineEncounterPayloads([
      { id: '1', attempts: [mk(2)] },
      { id: '2', attempts: [mk(2)] },
      { id: '3', attempts: [mk(2)] },
      { id: '4', attempts: [mk(2)] },
    ]);
    expect(s2.handlingScore).toBe(667);

    // 3, 3, 2, 2 -> 833
    const s3 = combineEncounterPayloads([
      { id: '1', attempts: [mk(3)] },
      { id: '2', attempts: [mk(3)] },
      { id: '3', attempts: [mk(2)] },
      { id: '4', attempts: [mk(2)] },
    ]);
    expect(s3.handlingScore).toBe(833);

    // 3, 3, 3, 2 -> 917
    const s4 = combineEncounterPayloads([
      { id: '1', attempts: [mk(3)] },
      { id: '2', attempts: [mk(3)] },
      { id: '3', attempts: [mk(3)] },
      { id: '4', attempts: [mk(2)] },
    ]);
    expect(s4.handlingScore).toBe(917);
  });

  it('reports unplayed Encounters with 0 Paws, 0 attempts and no seed', () => {
    const e1: EncounterAttempt = { paws: 2, payload: payloadWith({ seed: 42 }) };
    const combined = combineEncounterPayloads([
      { id: 'played-1', attempts: [e1] },
      { id: 'unplayed-2', attempts: [] },
    ]);
    expect(combined.encounters).toEqual([
      { id: 'played-1', paws: 2, attempts: 1, seed: 42 },
      { id: 'unplayed-2', paws: 0, attempts: 0 },
    ]);
    expect('seed' in combined.encounters![1]).toBe(false);
  });

  it('sets handlingScore: 500 when skipped', () => {
    const e1: EncounterAttempt = { paws: 3, payload: payloadWith() };
    const combined = combineEncounterPayloads(
      [{ id: '1', attempts: [e1] }, { id: '2', attempts: [] }],
      { skipped: true },
    );
    expect(combined.handlingScore).toBe(500);
  });

  it('gives the skip baseline counts when there is no kept attempt at all', () => {
    const combined = combineEncounterPayloads(
      [{ id: '1', attempts: [] }, { id: '2', attempts: [] }],
      { skipped: true },
    );
    expect(combined.handlingScore).toBe(500);
    expect(combined.durationSeconds).toBe(30);
    expect(combined.slackPercentage).toBe(100);
    expect(combined.tautPercentage).toBe(0);
    expect(combined.pullPercentage).toBe(0);
    expect(combined.markerHits).toBe(0);
    expect(combined.encounters).toEqual([
      { id: '1', paws: 0, attempts: 0 },
      { id: '2', paws: 0, attempts: 0 },
    ]);
  });

  it('includes encounters array holding id, Paws, attempts, seed', () => {
    const a1: EncounterAttempt = { paws: 1, payload: payloadWith({ seed: 10 }) };
    const a2: EncounterAttempt = { paws: 3, payload: payloadWith({ seed: 20 }) };
    const combined = combineEncounterPayloads([
      { id: 'first', attempts: [a1, a2] },
    ]);
    expect(combined.encounters).toEqual([
      { id: 'first', paws: 3, attempts: 2, seed: 20 },
    ]);
  });
});
