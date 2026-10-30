import { es } from '../../i18n';
import { DEFAULT_ATTRIBUTES } from '../../sim/learning';
import { newDogRecord } from '../dogRecord';
import { DIARY_OUTCOMES } from '../streak';
import { payloadWith } from '../testPayload';
import { BARKDOKU_INTRO_NODE, DOORBELL_MAT_NODE, HARNESS_RITUAL_NODE, LEAVE_IT_NODE, NODES, POSTE_PRACTICE, SCOOTER_NODE, URBAN_MIX_NODE, WALK_DISTRACTION } from './content';
import { placeOf, worldOfNode } from '../world';
import { findLesson } from '../lessons/content';
import { INTRO_NODE } from '../onboarding/introNode';
import { advance, checkpointLimit, isAvailable, metricScores, missingPrerequisites, onDebrief, pickExercise, primerCardOf, shouldShowPosteLink, startNode, type NodeRun } from './node';
import { newPosteMinigame, posteMinigameMetrics, POSTE_MINIGAME, stepPosteMinigame, tensionOf } from './posteMinigame';

const stageResult = (over = {}) => ({ kind: 'stage' as const, payload: payloadWith(over) });

function toSimulation(node = WALK_DISTRACTION): NodeRun {
  let run = startNode(node);
  for (let i = 0; i < node.primerCards.length; i++) run = advance(run, { type: 'next' });
  return advance(run, { type: 'answer', option: 0 });
}

describe('prerequisites', () => {
  it('reports a Node as unavailable until its prerequisites are completed', () => {
    expect(isAvailable(WALK_DISTRACTION, [])).toBe(false);
    expect(missingPrerequisites(WALK_DISTRACTION, [])).toEqual(['poste-practice']);
    expect(isAvailable(WALK_DISTRACTION, ['poste-practice'])).toBe(true);
    expect(isAvailable(POSTE_PRACTICE, [])).toBe(true);
  });

  it('makes the Poste practice a prerequisite of the Poste scenario', () => {
    expect(WALK_DISTRACTION.prerequisites).toContain(POSTE_PRACTICE.id);
  });
});

describe('Node state machine', () => {
  it('runs Primer, Checkpoint, Interactive Simulation, Debrief in order', () => {
    let run = startNode(WALK_DISTRACTION);
    const steps = [run.step];
    for (let i = 0; i < WALK_DISTRACTION.primerCards.length; i++) {
      run = advance(run, { type: 'next' });
      if (steps[steps.length - 1] !== run.step) steps.push(run.step);
    }
    run = advance(run, { type: 'answer', option: 0 });
    steps.push(run.step);
    run = advance(run, { type: 'finish', result: stageResult() });
    steps.push(run.step);
    expect(steps).toEqual(['primer', 'checkpoint', 'simulation', 'debrief']);
  });

  it('does not skip a step', () => {
    const start = startNode(WALK_DISTRACTION);
    expect(advance(start, { type: 'answer', option: 0 }).step).toBe('primer');
    expect(advance(start, { type: 'finish', result: stageResult() }).step).toBe('primer');
    const atCheckpoint = { ...start, step: 'checkpoint' as const };
    expect(advance(atCheckpoint, { type: 'finish', result: stageResult() }).step).toBe('checkpoint');
  });

  it('shows 1 or 2 recap cards on a trail Node, and 3 to 5 on the introductory Node', () => {
    for (const node of NODES) {
      expect(node.primerCards.length).toBeGreaterThanOrEqual(1);
      expect(node.primerCards.length).toBeLessThanOrEqual(2);
    }
    expect(INTRO_NODE.primerCards.length).toBeGreaterThanOrEqual(3);
    expect(INTRO_NODE.primerCards.length).toBeLessThanOrEqual(5);
  });

  it('records a missed answer on timeout and still starts the simulation', () => {
    let run = startNode(POSTE_PRACTICE);
    for (const _ of POSTE_PRACTICE.primerCards) run = advance(run, { type: 'next' });
    run = advance(run, { type: 'timeout' });
    expect(run.step).toBe('simulation');
    expect(run.checkpoint).toBe('missed');
  });

  it('starts the simulation after a wrong answer without touching the Dog', () => {
    const record = newDogRecord();
    let run = startNode(WALK_DISTRACTION);
    for (const _ of WALK_DISTRACTION.primerCards) run = advance(run, { type: 'next' });
    run = advance(run, { type: 'answer', option: 1 });
    expect(run.step).toBe('simulation');
    expect(run.checkpoint).toBe('wrong');
    expect(record.attributes).toEqual(DEFAULT_ATTRIBUTES);
  });

  it('ignores an answer that is not an option', () => {
    let run = startNode(POSTE_PRACTICE);
    for (const _ of POSTE_PRACTICE.primerCards) run = advance(run, { type: 'next' });
    expect(advance(run, { type: 'answer', option: 9 }).step).toBe('checkpoint');
  });

  it('refuses a result of the wrong kind for the mode', () => {
    expect(advance(toSimulation(WALK_DISTRACTION), { type: 'finish', result: { kind: 'minigame', metrics: {} } }).step).toBe('simulation');
    expect(advance(toSimulation(POSTE_PRACTICE), { type: 'finish', result: stageResult() }).step).toBe('simulation');
  });

  it('turns the Checkpoint setting into a limit: 5 s, 10 s or none', () => {
    expect(checkpointLimit(5)).toBe(5);
    expect(checkpointLimit(10)).toBe(10);
    expect(checkpointLimit(0)).toBeNull();
  });
});

describe('Stage and Minigame modes', () => {
  it('updates the Dog only after a Stage', () => {
    const run = advance(toSimulation(WALK_DISTRACTION), { type: 'finish', result: stageResult({ followMarks: 3, checkInHits: 3 }) });
    const after = onDebrief(newDogRecord(), run, new Date('2026-02-02T00:00:00Z'));
    expect(after.attributes.followChance).toBeGreaterThan(DEFAULT_ATTRIBUTES.followChance);
    expect(after.lastStageDate).not.toBeNull();
    expect(after.completedNodes).toEqual(['walk-distraction']);
  });

  it('leaves the Learning Attributes unchanged after a Minigame, yet completes the Node', () => {
    const run = advance(toSimulation(POSTE_PRACTICE), { type: 'finish', result: { kind: 'minigame', metrics: { poste: 0 } } });
    const record = newDogRecord();
    const after = onDebrief(record, run, new Date());
    expect(after.attributes).toEqual(record.attributes);
    expect(after.triggerProfile).toEqual(record.triggerProfile);
    expect(after.lastStageDate).toBeNull();
    expect(after.completedNodes).toEqual(['poste-practice']);
  });

  it('counts the Node as completed when the Debrief is reached even if the technique failed, and stays replayable', () => {
    const failed = advance(toSimulation(POSTE_PRACTICE), { type: 'finish', result: { kind: 'minigame', metrics: { poste: 0, tension: 0 } } });
    const once = onDebrief(newDogRecord(), failed, new Date());
    expect(isAvailable(WALK_DISTRACTION, once.completedNodes)).toBe(true);
    const twice = onDebrief(once, failed, new Date());
    expect(twice.completedNodes).toEqual(['poste-practice']);
    expect(startNode(POSTE_PRACTICE).step).toBe('primer');
  });

  it('does nothing before the Debrief', () => {
    const record = newDogRecord();
    expect(onDebrief(record, toSimulation(), new Date())).toBe(record);
  });

  it('shows the Poste practice link after two failed Poste attempts on other Nodes, never on the practice itself', () => {
    const record = newDogRecord();
    expect(shouldShowPosteLink(record, WALK_DISTRACTION.id)).toBe(false);
    const failedOnce = { ...record, posteFailures: 1 };
    expect(shouldShowPosteLink(failedOnce, WALK_DISTRACTION.id)).toBe(false);
    const failedTwice = { ...record, posteFailures: 2 };
    expect(shouldShowPosteLink(failedTwice, WALK_DISTRACTION.id)).toBe(true);
    expect(shouldShowPosteLink(failedTwice, POSTE_PRACTICE.id)).toBe(false);
  });
});

describe('Debrief exercise', () => {
  it('offers the leash-tension exercise when Rigid Pull is the weakest metric', () => {
    const result = stageResult({ pullPercentage: 60, markerHits: 1, posteSuccesses: 1, checkInHits: 2 });
    expect(metricScores(result).tension).toBeCloseTo(0.4);
    expect(pickExercise(WALK_DISTRACTION, result).metric).toBe('tension');
  });

  it('offers the timing exercise when no Marker hit was earned in an encounter', () => {
    const result = stageResult({ markerMisses: 1, missedOpportunities: 0, posteSuccesses: 1, checkInHits: 2 });
    expect(pickExercise(WALK_DISTRACTION, result).metric).toBe('timing');
  });

  it('offers exactly one exercise from the Node list', () => {
    const exercise = pickExercise(WALK_DISTRACTION, stageResult());
    expect(WALK_DISTRACTION.exercises).toContain(exercise);
  });

  it('picks the Poste exercise after a Poste practice with no settled round', () => {
    const exercise = pickExercise(POSTE_PRACTICE, { kind: 'minigame', metrics: { poste: 0, tension: 0.9 } });
    expect(exercise.metric).toBe('poste');
  });

  it('skips metrics the Node has no exercise for', () => {
    const exercise = pickExercise(POSTE_PRACTICE, stageResult({ checkInHits: 0 }));
    expect(['poste', 'tension']).toContain(exercise.metric);
  });
});

describe('Barkdoku minigame node integration', () => {
  it('supports barkdoku in minigame node simulation and calculates metric scores', () => {
    const barkdokuNode: any = {
      id: 'test-barkdoku',
      title: 'node.barkdoku.title',
      mode: 'minigame',
      primerCards: ['primer.1', 'primer.2', 'primer.3'],
      checkpoint: {
        question: 'q',
        options: [{ text: 'opt1', correct: true }, { text: 'opt2', correct: false }],
      },
      simulation: { minigame: 'barkdoku' },
      exercises: [{ metric: 'tension', key: 'ex.tension' }],
      prerequisites: [],
    };

    let run = startNode(barkdokuNode);
    expect(run.node.simulation.minigame).toBe('barkdoku');
    expect(run.step).toBe('primer');
    run = advance(run, { type: 'next' });
    run = advance(run, { type: 'next' });
    run = advance(run, { type: 'next' });
    expect(run.step).toBe('checkpoint');
    run = advance(run, { type: 'answer', option: 0 });
    expect(run.step).toBe('simulation');

    const result = {
      kind: 'minigame' as const,
      metrics: {
        timing: 1,
        attention: 0.8,
        tension: 1,
      },
    };
    run = advance(run, { type: 'finish', result });
    expect(run.step).toBe('debrief');
    expect(metricScores(run.result!)).toEqual({
      timing: 1,
      attention: 0.8,
      tension: 1,
    });
  });

  it('keeps the solved board in the Node entry of the Activity Log', () => {
    const run: NodeRun = {
      ...startNode(BARKDOKU_INTRO_NODE),
      step: 'debrief',
      result: { kind: 'minigame', metrics: { timing: 1 }, handlingScore: 1000, puzzle: { size: 4, difficulty: 'tutorial', durationSeconds: 190, mistakes: 0 } },
    };
    const [entry] = onDebrief(newDogRecord(), run, new Date('2026-02-02T10:00:00Z')).activityLog;
    expect(entry).toMatchObject({ kind: 'node', id: BARKDOKU_INTRO_NODE.id, stars: 3, metrics: { timing: 1 }, puzzle: { size: 4, durationSeconds: 190, mistakes: 0 } });
  });
});

describe('initial content', () => {
  it('comes from the catalog', () => {
    for (const node of NODES) {
      const keys = [node.title, ...node.primerCards.map((c) => primerCardOf(c).text), node.checkpoint.question, ...node.checkpoint.options.map((o) => o.text), ...node.exercises.map((e) => e.key)];
      for (const key of keys) expect(es[key]).toBeTruthy();
      expect(node.checkpoint.options.filter((o) => o.correct)).toHaveLength(1);
    }
  });
});

describe('Poste practice Minigame', () => {
  const hold = (state = newPosteMinigame(), seconds: number, holding = true) => {
    let s = state;
    for (let i = 0; i < Math.round(seconds * 60); i++) s = stepPosteMinigame(s, 1 / 60, holding);
    return s;
  };

  it('settles the Dog when held long enough', () => {
    const s = hold(newPosteMinigame(), POSTE_MINIGAME.holdToSettle + 0.1);
    expect(s.outcomes).toEqual(['settled']);
    expect(s.round).toBe(1);
  });

  it('fails the round when released early', () => {
    const held = hold(newPosteMinigame(), 0.8);
    const s = hold(held, 0.1, false);
    expect(s.outcomes).toEqual(['released']);
  });

  it('fails a round nobody holds, and records the rigid leash time', () => {
    const s = hold(newPosteMinigame(), POSTE_MINIGAME.roundSeconds + 0.1, false);
    expect(s.outcomes).toEqual(['too-late']);
    expect(s.rigidSeconds).toBeGreaterThan(2);
  });

  it('strains the leash over time and relaxes it while held', () => {
    expect(tensionOf(hold(newPosteMinigame(), 2, false))).toBeGreaterThan(0.5);
    const mid = hold(newPosteMinigame(), 2, false);
    expect(tensionOf(hold(mid, 1.5))).toBeLessThan(tensionOf(mid));
  });

  it('ends after all rounds with metrics for the Debrief', () => {
    let s = newPosteMinigame();
    for (let r = 0; r < POSTE_MINIGAME.rounds; r++) s = hold(s, POSTE_MINIGAME.holdToSettle + 0.1);
    expect(s.done).toBe(true);
    expect(posteMinigameMetrics(s)).toEqual({ poste: 1, tension: 1 });
    expect(hold(s, 5)).toEqual(s);
  });

  it('scores a Minigame that was never held as no Poste', () => {
    let s = newPosteMinigame();
    for (let r = 0; r < POSTE_MINIGAME.rounds; r++) s = hold(s, POSTE_MINIGAME.roundSeconds + 0.1, false);
    const m = posteMinigameMetrics(s);
    expect(m.poste).toBe(0);
    expect(m.tension).toBeLessThan(0.7);
  });
});

describe('Debrief Walk Diary and Streak', () => {
  const debriefed = (node = WALK_DISTRACTION, result = stageResult()) => advance(toSimulation(node), { type: 'finish', result });
  const day = (d: number) => new Date(2026, 4, d, 10);

  it('offers three one-tap answers with the specified wording', () => {
    expect(DIARY_OUTCOMES).toEqual(['completed', 'struggled', 'skipped']);
    expect(es['diary.completed']).toBe('¡Conseguido!');
    expect(es['diary.struggled']).toBe('Costó un poco');
    expect(es['diary.skipped']).toBe('Hoy no pudimos');
  });

  it('logs nothing in the Walk Diary: check-ins happen on the Mission', () => {
    expect(onDebrief(newDogRecord(), debriefed(), day(1)).walkDiary).toEqual([]);
  });

  it('writes the Debrief exercise as "Tu foco" of the Mission that ends the Stretch', () => {
    const run = debriefed(WALK_DISTRACTION, stageResult({ pullPercentage: 90, checkInHits: 2 }));
    const after = onDebrief(newDogRecord(), run, day(1));
    expect(after.missions['mission-walk']).toEqual({ target: 'full', skipRun: 0, attempts: [], focus: pickExercise(WALK_DISTRACTION, run.result!).key });
    expect(after.missions['mission-walk'].focus).toBe('node.walk.exerciseTension');
    // a replay with another weakest metric updates it, and nothing starts the Mission
    const replay = onDebrief(after, debriefed(WALK_DISTRACTION, stageResult({ pullPercentage: 0, checkInHits: 0 })), day(2));
    expect(replay.missions['mission-walk'].focus).toBe('node.walk.exerciseAttention');
    expect(replay.missions['mission-walk'].startedAt).toBeUndefined();
  });

  it('makes the day of a Debrief active for the Streak, Stage or Minigame, and again on a replay without adding', () => {
    const stage = onDebrief(newDogRecord(), debriefed(), day(1));
    expect(stage.streak).toEqual({ current: 1, best: 1, lastActiveDate: '2026-05-01' });
    const replay = onDebrief(stage, debriefed(), day(1));
    expect(replay.streak.current).toBe(1);
    const minigame = onDebrief(stage, debriefed(POSTE_PRACTICE, { kind: 'minigame' as const, metrics: { poste: 1 } } as never), day(2));
    expect(minigame.streak.current).toBe(2);
  });

  it('adds one for each consecutive day and starts again at 1 after a missed day', () => {
    let r = newDogRecord();
    for (const d of [1, 2, 3]) r = onDebrief(r, debriefed(), day(d));
    expect(r.streak.current).toBe(3);
    r = onDebrief(r, debriefed(), day(5));
    expect(r.streak).toMatchObject({ current: 1, best: 3 });
  });

  it('leaves the Dog untouched by the Streak itself', () => {
    const run = debriefed(POSTE_PRACTICE, { kind: 'minigame' as const, metrics: { poste: 1 } } as never);
    const before = newDogRecord();
    const after = onDebrief(before, run, day(1));
    expect(after.attributes).toEqual(before.attributes);
    expect(after.triggerProfile).toEqual(before.triggerProfile);
  });

  it('does not log anything before the user answers', () => {
    expect(onDebrief(newDogRecord(), debriefed(), day(1)).walkDiary).toEqual([]);
  });
});

describe('World 1 minigame Nodes', () => {
  it('count as completed at the Debrief, never change the Dog, and offer a matching exercise', () => {
    for (const node of [HARNESS_RITUAL_NODE, DOORBELL_MAT_NODE]) {
      expect(node.mode).toBe('minigame');
      const run = advance(toSimulation(node), { type: 'finish', result: { kind: 'minigame', metrics: { poste: 0.5, timing: 0.5, tension: 0.9 } } });
      const record = newDogRecord();
      const after = onDebrief(record, run, new Date());
      expect(after.completedNodes).toEqual([node.id]);
      expect(after.attributes).toEqual(record.attributes);
      expect(node.exercises).toContain(pickExercise(node, run.result!));
    }
  });

  it('picks the timing exercise after a poorly timed Doorbell Mat', () => {
    const exercise = pickExercise(DOORBELL_MAT_NODE, { kind: 'minigame', metrics: { timing: 0, tension: 1 } });
    expect(exercise.metric).toBe('timing');
  });
});

describe('World 3 Cue ramp', () => {
  it('shows only "Leave It" in the introductory food Node and both Cues in the mixed Nodes', () => {
    expect(LEAVE_IT_NODE.simulation.scenario?.cues).toEqual(['leave-it']);
    expect(SCOOTER_NODE.simulation.scenario?.cues).toEqual(['lets-go', 'leave-it']);
    expect(URBAN_MIX_NODE.simulation.scenario?.cues).toEqual(['lets-go', 'leave-it']);
  });

  it('runs the introductory Node first: the mixed Nodes need it done', () => {
    expect(isAvailable(SCOOTER_NODE, [])).toBe(false);
    expect(isAvailable(SCOOTER_NODE, [LEAVE_IT_NODE.id])).toBe(true);
    expect(isAvailable(URBAN_MIX_NODE, [LEAVE_IT_NODE.id])).toBe(false);
    expect(isAvailable(URBAN_MIX_NODE, [LEAVE_IT_NODE.id, SCOOTER_NODE.id])).toBe(true);
  });

  it('keeps Worlds 1 and 2 on the single "Let\'s Go" button', () => {
    for (const node of NODES.filter((n) => n.mode === 'stage' && n.id !== LEAVE_IT_NODE.id)) {
      const cues = node.simulation.scenario?.cues ?? ['lets-go'];
      const world = worldOfNode(node.id)!.worldNumber;
      if (world <= 2) expect(cues).toEqual(['lets-go']);
    }
  });
});

describe('structured Primer cards', () => {
  it('reads a legacy text key as a real-world card', () => {
    expect(primerCardOf('node.poste.card1')).toEqual({ kind: 'real-world', text: 'node.poste.card1' });
  });

  it('keeps a structured card with its media and tutorial as plain data', () => {
    const card = { kind: 'virtual-dog' as const, text: 'node.poste.card1' as const, media: { type: 'video' as const, url: '', caption: 'media.caption.poste' as const, placeholder: true }, tutorialUrl: 'https://example.com/poste' };
    expect(primerCardOf(card)).toBe(card);
    expect(JSON.parse(JSON.stringify(card))).toEqual(card);
  });

  it('advances through structured cards like legacy ones', () => {
    const node = { ...POSTE_PRACTICE, primerCards: [{ kind: 'real-world' as const, text: 'node.poste.card1' as const }, { kind: 'virtual-dog' as const, text: 'node.poste.card2' as const }] };
    let run = startNode(node);
    run = advance(run, { type: 'next' });
    expect(run).toMatchObject({ step: 'primer', card: 1 });
    expect(advance(run, { type: 'next' }).step).toBe('checkpoint');
  });

  it('recaps the theory Lesson first, and the controls only after a How-to-play Lesson', () => {
    for (const node of NODES) {
      const place = placeOf({ kind: 'node', id: node.id })!;
      const before = place.world.stretches[place.stretch].slice(0, place.index);
      const afterHowTo = before.some((s) => s.kind === 'lesson' && findLesson(s.id)?.kind === 'how-to-play');
      const cards = node.primerCards.map(primerCardOf);
      expect(cards[0].kind).toBe('real-world');
      expect({ node: node.id, cards: cards.length }).toEqual({ node: node.id, cards: afterHowTo ? 2 : 1 });
      if (afterHowTo) expect(cards[1].kind).toBe('virtual-dog');
      for (const c of cards) {
        expect(es[c.text]).toBeTruthy();
        if (c.media) expect(es[c.media.caption]).toBeTruthy();
      }
    }
  });

  it('keeps the dual-aspect Primer on the introductory Node, real-world first', () => {
    const cards = INTRO_NODE.primerCards.map(primerCardOf);
    expect(cards[0].kind).toBe('real-world');
    expect(cards.some((c) => c.kind === 'virtual-dog')).toBe(true);
  });

  it('tests the theory Lesson in the Checkpoint of every trail Node', () => {
    for (const node of NODES) expect(node.checkpoint.question).toMatch(/\.tq\.question$/);
  });
});
