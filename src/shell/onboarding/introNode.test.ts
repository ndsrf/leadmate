import { es } from '../../i18n';
import { advance, pickExercise, startNode } from '../nodes/node';
import { payloadWith } from '../testPayload';
import { INTRO_NODE } from './introNode';

describe('INTRO_NODE', () => {
  it('has 4 primer cards, a valid checkpoint, and exercises with keys in the catalog', () => {
    expect(INTRO_NODE.id).toBe('intro-node');
    expect(INTRO_NODE.mode).toBe('stage');
    expect(INTRO_NODE.primerCards).toHaveLength(4);
    expect(es[INTRO_NODE.title]).toBeTruthy();

    for (const card of INTRO_NODE.primerCards) {
      if (typeof card === 'string') {
        expect(es[card]).toBeTruthy();
      } else {
        expect(es[card.text]).toBeTruthy();
      }
    }

    expect(INTRO_NODE.checkpoint).toHaveLength(1);
    const [question] = INTRO_NODE.checkpoint;
    expect(es[question.question]).toBeTruthy();
    expect(es[question.explanation]).toBeTruthy();
    expect(question.options).toHaveLength(3);
    const correctOptions = question.options.filter((o) => o.correct);
    expect(correctOptions).toHaveLength(1);
    for (const opt of question.options) {
      expect(es[opt.text]).toBeTruthy();
    }

    expect(INTRO_NODE.exercises.length).toBeGreaterThan(0);
    for (const ex of INTRO_NODE.exercises) {
      expect(es[ex.key]).toBeTruthy();
    }
  });

  it('steps through primer -> checkpoint -> simulation -> debrief via the Node state machine', () => {
    let run = startNode(INTRO_NODE);
    expect(run.step).toBe('primer');
    expect(run.card).toBe(0);

    // 4 cards -> 3 next actions
    run = advance(run, { type: 'next' });
    expect(run.step).toBe('primer');
    expect(run.card).toBe(1);

    run = advance(run, { type: 'next' });
    expect(run.card).toBe(2);

    run = advance(run, { type: 'next' });
    expect(run.card).toBe(3);

    run = advance(run, { type: 'next' });
    expect(run.step).toBe('checkpoint');

    run = advance(run, { type: 'answer', option: 0 });
    expect(run.step).toBe('simulation');
    expect(run.checkpoint).toEqual(['correct']);

    const payload = payloadWith({ markerHits: 2, pullPercentage: 15 });
    run = advance(run, { type: 'finish', result: { kind: 'stage', payload } });
    expect(run.step).toBe('debrief');
    expect(run.result).toEqual({ kind: 'stage', payload });

    const exercise = pickExercise(INTRO_NODE, run.result!);
    expect(exercise).toBeDefined();
    expect(es[exercise.key]).toBeTruthy();
  });
});
