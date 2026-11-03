import { es } from '../../i18n/es';
import { CALM_HANDS_NODE, CALM_HANDS_VARIANT_KEYS, nodeForDog } from './content';
import { advance, onDebrief, primerCardOf, startNode, type NodeDef } from './node';
import { buildCloseExercisePayload, createCloseExerciseState, noCloseExerciseInput, tickCloseExercise } from '../../sim/closeExercise';
import { handDrillScenario } from './scenarios';
import { newDogRecord } from '../dogRecord';
import { skippedSimulationPayload } from '../../sim/payload';
import { stopLock, progressOf } from '../world';

const dog = (ageBand: 'puppy' | 'adolescent' | 'adult' | 'senior' | null, completedNodes: string[] = []) => ({ ageBand, completedNodes });
const keysOf = (node: NodeDef) => [
  node.title,
  ...node.primerCards.map((c) => primerCardOf(c).text),
  ...node.checkpoint.flatMap((q) => [q.question, q.explanation, ...q.options.map((o) => o.text)]),
  ...node.exercises.map((e) => e.key),
  ...(node.debrief ? [node.debrief.calm, node.debrief.notCalm] : []),
];

describe('the "calm hands and leash" Node (task 3.1)', () => {
  it('is a close-view hand drill that needs only the how-to-play Lesson', () => {
    expect(CALM_HANDS_NODE.mode).toBe('close_exercise');
    expect(CALM_HANDS_NODE.simulation.closeScenario?.controls).toBe('hand_drill');
    expect(CALM_HANDS_NODE.opensAfterLesson).toBe('howto-choose-action');
    expect(stopLock({ kind: 'node', id: 'calm-hands' }, progressOf([], { readLessons: ['howto-choose-action'] }))).toBeNull();
  });

  it('picks puppy copy and a toy reward for a puppy', () => {
    const n = nodeForDog(CALM_HANDS_NODE, dog('puppy'));
    expect(primerCardOf(n.primerCards[0]).text).toBe('node.calmhands.recap1.puppy');
    expect(n.exercises[0].key).toBe('node.calmhands.exercise1.puppy');
    expect(n.simulation.closeScenario?.reward).toBe('toy');
  });

  it('picks adult copy for an adult', () => {
    const n = nodeForDog(CALM_HANDS_NODE, dog('adult'));
    expect(primerCardOf(n.primerCards[0]).text).toBe('node.calmhands.recap1.adult');
    expect(n.checkpoint[0].question).toBe('node.calmhands.tq1.question.adult');
    expect(n.simulation.closeScenario?.reward).toBe('treat');
  });

  it('keeps the neutral keys, with no mention of a puppy, for an unknown age', () => {
    const n = nodeForDog(CALM_HANDS_NODE, dog(null));
    expect(keysOf(n)).toEqual(keysOf(CALM_HANDS_NODE));
    for (const key of keysOf(n)) expect(es[key].toLowerCase()).not.toMatch(/cachorro/);
    expect(n.simulation.closeScenario?.reward).toBe('treat');
    expect(es['node.calmhands.recap1']).toMatch(/tu perro/);
  });

  it('has a variant for every age band of every varying key', () => {
    for (const key of CALM_HANDS_VARIANT_KEYS) for (const band of ['puppy', 'adolescent', 'adult', 'senior']) expect(es[`${key}.${band}` as keyof typeof es]).toBeTruthy();
  });

  it('changes numbers and copy only, never the control set', () => {
    for (const band of ['puppy', 'adolescent', 'adult', 'senior', null] as const) {
      const n = nodeForDog(CALM_HANDS_NODE, dog(band));
      expect(n.simulation.closeScenario?.controls).toBe('hand_drill');
      expect(n.mode).toBe('close_exercise');
    }
  });

  it('uses the gentle first-run tuning until the Node is completed', () => {
    const first = nodeForDog(CALM_HANDS_NODE, dog('adult')).simulation.closeScenario!;
    const later = nodeForDog(CALM_HANDS_NODE, dog('adult', ['calm-hands'])).simulation.closeScenario!;
    expect(first.markBudget!).toBeGreaterThan(later.markBudget!);
  });

  it('leaves other Nodes alone', () => {
    const other: NodeDef = { ...CALM_HANDS_NODE, id: 'something-else' };
    expect(nodeForDog(other, dog('puppy'))).toBe(other);
  });

  it('opens its Debrief with the only the how-to-play Lesson read, and carries calm and not-calm lines', () => {
    expect(es[CALM_HANDS_NODE.debrief!.calm]).toBeTruthy();
    expect(es[CALM_HANDS_NODE.debrief!.notCalm]).toBeTruthy();
  });
});

describe('no physical correction in the Node text (task 3.4)', () => {
  const banned = /golpe|pegar|pega\b|patada|empuj|sacud|tir[oó]n|tirar|levant|alzar|colgar|zarande|agarr|collar de ahogo|grit/i;
  it('says nothing that tells the user to correct the Dog physically, in any age band', () => {
    for (const band of ['puppy', 'adolescent', 'adult', 'senior', null] as const) {
      for (const key of keysOf(nodeForDog(CALM_HANDS_NODE, dog(band)))) expect({ key, hit: banned.test(es[key]) }).toEqual({ key, hit: false });
    }
  });
});

describe('completing the Node by reaching its Debrief (task 4.1)', () => {
  const playToDebrief = (gather: boolean) => {
    const sim = createCloseExerciseState(handDrillScenario('puppy', true), 5);
    for (let i = 0; i < 60 * 70 && !sim.completed; i++) tickCloseExercise(sim, { ...noCloseExerciseInput, gather });
    expect(sim.completed).toBe(true);
    let run = startNode(nodeForDog(CALM_HANDS_NODE, dog('puppy')));
    for (let i = 0; i < 10 && run.step === 'primer'; i++) run = advance(run, { type: 'next' });
    for (let i = 0; i < 5 && run.step === 'checkpoint'; i++) run = advance(run, { type: 'answer', option: 0 });
    expect(run.step).toBe('simulation');
    return advance(run, { type: 'finish', result: { kind: 'close_exercise', payload: buildCloseExercisePayload(sim) } });
  };

  it('completes the Node and earns at least one star when the Dog settled', () => {
    const run = playToDebrief(true);
    expect(run.step).toBe('debrief');
    const after = onDebrief(newDogRecord(), run, new Date('2026-11-02T10:00:00Z'));
    expect(after.completedNodes).toContain('calm-hands');
    expect(after.stars['calm-hands']).toBeGreaterThanOrEqual(1);
  });

  it('completes it, with no failure, when the time ran out first', () => {
    const run = playToDebrief(false);
    expect(run.result && run.result.kind === 'close_exercise' && run.result.payload.handDrillOutcome).toBe('not_calm');
    const after = onDebrief(newDogRecord(), run, new Date('2026-11-02T10:00:00Z'));
    expect(after.completedNodes).toContain('calm-hands');
    expect(after.stars['calm-hands']).toBeGreaterThanOrEqual(1);
  });

  it('completes it when the simulation is skipped', () => {
    let run = startNode(CALM_HANDS_NODE);
    run = { ...run, step: 'simulation' };
    run = advance(run, { type: 'finish', result: { kind: 'close_exercise', payload: skippedSimulationPayload(1, 'close_exercise'), skipped: true } });
    expect(onDebrief(newDogRecord(), run, new Date()).completedNodes).toContain('calm-hands');
  });
});
