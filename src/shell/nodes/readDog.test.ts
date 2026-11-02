import { postureSpec } from '../ui/canine';
import { BASICS_SCENES, buildScript, correctAction, CORRECT_ACTION, currentState, harnessOn, hintKey, readDogSceneOf, newReadDog, READ_DOG, readDogHandlingScore, readDogMetrics, SCENE_ACTIONS, stepReadDog, type ReadDogAction, type ReadDogRun, type ReadDogScene } from './readDog';
import { es } from '../../i18n';
import { starsFor } from '../stars';

const SCENES: ReadDogScene[] = ['harness', 'doorbell', 'affection', 'rest', 'calm', 'bark-home', 'destroy', 'eat-objects'];
const HOME: ReadDogScene[] = ['bark-home', 'destroy', 'eat-objects'];
const BASICS: ReadDogScene[] = ['affection', 'rest', 'calm'];

const right = (run: ReadDogRun) => stepReadDog(run, 0.05, correctAction(run.scene, currentState(run))!);
const wrongFor = (run: ReadDogRun): ReadDogAction => SCENE_ACTIONS[run.scene].find((a) => a !== correctAction(run.scene, currentState(run)))!;
const wrong = (run: ReadDogRun) => stepReadDog(run, 0.05, wrongFor(run));
const timeOut = (run: ReadDogRun) => stepReadDog(run, READ_DOG.decisionSeconds + 0.1, null);

/** Plays a scene answering each beat as `plan[i]` says; every beat not in the plan is answered right. */
function play(scene: ReadDogScene, plan: Record<number, 'wrong-once' | 'wrong-twice' | 'timeout'> = {}, seed = 3): ReadDogRun {
  let run = newReadDog(scene, seed);
  while (!run.done) {
    const how = plan[run.index];
    if (how === 'timeout') run = timeOut(run);
    else if (how === 'wrong-twice') run = wrong(wrong(run));
    else if (how === 'wrong-once') run = right(wrong(run));
    else run = right(run);
  }
  return run;
}

describe('Read the Dog scripts', () => {
  it('has the beats of each scene', () => {
    expect(buildScript('harness', 1)).toHaveLength(READ_DOG.beats.harness);
    expect(buildScript('doorbell', 1)).toHaveLength(READ_DOG.beats.doorbell);
  });

  it('ends every scene with the Dog calm, whatever the seed', () => {
    for (const scene of SCENES) {
      for (let seed = 0; seed < 40; seed++) {
        const script = buildScript(scene, seed);
        expect(script[script.length - 1]).toBe('relaxed_lying');
        expect(correctAction(scene, script[script.length - 1])).toBe('marker');
      }
    }
  });

  it('gives the same script for the same seed, and varies with it', () => {
    for (const scene of SCENES) {
      expect(buildScript(scene, 9)).toEqual(buildScript(scene, 9));
      const seen = new Set(Array.from({ length: 40 }, (_, seed) => buildScript(scene, seed).join()));
      expect(seen.size).toBeGreaterThan(1);
    }
  });

  it('makes each of the four actions of a scene right for at least one state, so no button is right every time', () => {
    for (const scene of SCENES) {
      const needed = new Set(buildScripts(scene).flatMap((script) => script.map((s) => correctAction(scene, s))));
      for (const action of SCENE_ACTIONS[scene].filter((a) => a !== 'cuddle')) expect(needed.has(action)).toBe(true);
      expect(SCENE_ACTIONS[scene]).toHaveLength(4);
    }
  });

  it('offers Put on harness only in the Harness Ritual and Send to mat only in the Doorbell Mat', () => {
    expect(SCENE_ACTIONS.harness).toContain('harness');
    expect(SCENE_ACTIONS.harness).not.toContain('mat');
    expect(SCENE_ACTIONS.doorbell).toContain('mat');
    expect(SCENE_ACTIONS.doorbell).not.toContain('harness');
  });

  it('only scripts states whose right action the scene offers', () => {
    for (const scene of SCENES) {
      for (const script of buildScripts(scene)) for (const state of script) expect(SCENE_ACTIONS[scene]).toContain(correctAction(scene, state));
    }
  });
});

describe('per-scene rules', () => {
  it('keeps the Harness Ritual and Doorbell Mat tables unchanged', () => {
    expect(CORRECT_ACTION.harness).toEqual({ jumping: 'wait', sniffing: 'cue', sitting_attentive: 'harness', relaxed_lying: 'marker' });
    expect(CORRECT_ACTION.doorbell).toEqual({ alert_barking: 'mat', staring_door: 'mat', sniffing: 'cue', unsettled_on_mat: 'wait', relaxed_lying: 'marker' });
  });

  it('has the Basics scenes\u2019 actions and state tables from the spec', () => {
    expect(SCENE_ACTIONS.affection).toEqual(['ignore', 'send-bed', 'marker', 'cuddle']);
    expect(SCENE_ACTIONS.rest).toEqual(['ignore', 'send-away', 'marker', 'go-outside']);
    expect(SCENE_ACTIONS.calm).toEqual(['wait', 'send-away', 'marker', 'cue']);
    expect(CORRECT_ACTION.affection).toEqual({ begging_lift: 'ignore', on_furniture: 'send-bed', relaxed_lying: 'marker' });
    expect(CORRECT_ACTION.rest).toEqual({ nudging_attention: 'send-away', toy_indoors: 'go-outside', resting: 'ignore', relaxed_lying: 'marker' });
    expect(CORRECT_ACTION.calm).toEqual({ barking_nonstop: 'wait', zoomies: 'send-away', sitting_attentive: 'cue', relaxed_lying: 'marker' });
  });

  it('reads the same state differently by scene', () => {
    expect(correctAction('harness', 'sitting_attentive')).toBe('harness');
    expect(correctAction('calm', 'sitting_attentive')).toBe('cue');
  });

  it('never makes Cuddle right', () => {
    for (const scene of SCENES) expect(Object.values(CORRECT_ACTION[scene])).not.toContain('cuddle');
  });

  it('gives each Basics scene four beats ending calm, with an order that changes by seed', () => {
    for (const scene of BASICS) {
      expect(READ_DOG.beats[scene]).toBe(4);
      const scripts = buildScripts(scene);
      for (const script of scripts) {
        expect(script).toHaveLength(4);
        expect(script[3]).toBe('relaxed_lying');
        for (const state of script) expect(correctAction(scene, state)).toBeDefined();
      }
      expect(new Set(scripts.map((x) => x.join())).size).toBeGreaterThan(1);
    }
  });

  it('counts Cuddle as a mistake on every beat of Dog as a dog', () => {
    let run = newReadDog('affection', 5);
    while (!run.done) {
      const next = stepReadDog(run, 0.05, 'cuddle');
      expect(next.last?.kind === 'wrong' || next.last?.kind === 'failed').toBe(true);
      run = next;
    }
    expect(run.outcomes.every((o) => o === 'failed')).toBe(true);
  });
});

function buildScripts(scene: ReadDogScene) {
  return Array.from({ length: 40 }, (_, seed) => buildScript(scene, seed));
}

describe('stepReadDog', () => {
  it('moves to the next beat on the right action', () => {
    const run = right(newReadDog('harness', 1));
    expect(run.outcomes).toEqual(['correct']);
    expect(run.index).toBe(1);
    expect(run.last?.kind).toBe('correct');
  });

  it('marks a mistake on a wrong action and reopens the beat with a fresh window', () => {
    let run = newReadDog('doorbell', 1);
    run = stepReadDog(run, 3, null);
    run = wrong(run);
    expect(run.index).toBe(0);
    expect(run.mistakes).toBe(1);
    expect(run.wrongChoices).toBe(1);
    expect(run.t).toBe(0);
    expect(run.last?.kind).toBe('wrong');
  });

  it('counts a right action on the retry as a correct beat', () => {
    const run = right(wrong(newReadDog('doorbell', 1)));
    expect(run.outcomes).toEqual(['correct']);
    expect(run.wrongChoices).toBe(1);
  });

  it('fails the beat on a second wrong action and moves on', () => {
    const run = wrong(wrong(newReadDog('harness', 1)));
    expect(run.outcomes).toEqual(['failed']);
    expect(run.index).toBe(1);
    expect(run.wrongChoices).toBe(2);
    expect(run.last?.kind).toBe('failed');
  });

  it('counts a beat that times out with no choice as missed', () => {
    const run = timeOut(newReadDog('harness', 1));
    expect(run.outcomes).toEqual(['missed']);
    expect(run.index).toBe(1);
    expect(run.last?.kind).toBe('missed');
  });

  it('fails a beat that times out after a mistake', () => {
    const run = timeOut(wrong(newReadDog('harness', 1)));
    expect(run.outcomes).toEqual(['failed']);
  });

  it('keeps the window open until it ends', () => {
    const run = stepReadDog(newReadDog('harness', 1), READ_DOG.decisionSeconds - 0.5, null);
    expect(run.outcomes).toEqual([]);
    expect(run.t).toBeCloseTo(READ_DOG.decisionSeconds - 0.5);
  });

  it('is done after the last beat and then ignores input', () => {
    const run = play('harness');
    expect(run.done).toBe(true);
    expect(run.outcomes).toEqual(['correct', 'correct', 'correct', 'correct']);
    expect(stepReadDog(run, 1, 'marker')).toBe(run);
  });

  it('puts the harness on the Dog only once Put on harness was right', () => {
    let run = newReadDog('harness', 2);
    while (correctAction(run.scene, currentState(run)) !== 'harness') {
      expect(harnessOn(run)).toBe(false);
      run = right(run);
    }
    expect(harnessOn(wrong(run))).toBe(false);
    expect(harnessOn(right(run))).toBe(true);
    expect(harnessOn(newReadDog('doorbell', 2))).toBe(false);
  });

  it('does not put the harness on a Dog whose harness beat failed', () => {
    const script = buildScript('harness', 3);
    const run = play('harness', { [script.indexOf('sitting_attentive')]: 'timeout' });
    expect(harnessOn(run)).toBe(false);
  });
});

describe('read the Dog results', () => {
  it('reports a perfect Harness Ritual as poste 1, tension 1 and 1000', () => {
    const run = play('harness');
    expect(readDogMetrics(run)).toEqual({ poste: 1, tension: 1 });
    expect(readDogHandlingScore(run)).toBe(1000);
    expect(starsFor(readDogHandlingScore(run))).toBe(3);
  });

  it('reports a perfect Doorbell Mat with timing instead of poste', () => {
    const run = play('doorbell');
    expect(readDogMetrics(run)).toEqual({ timing: 1, tension: 1 });
    expect(readDogHandlingScore(run)).toBe(1000);
  });

  it('scores one failed beat as 750 of 4 and 800 of 5, still 2 stars', () => {
    const harness = play('harness', { 1: 'timeout' });
    expect(readDogHandlingScore(harness)).toBe(750);
    expect(starsFor(750)).toBe(2);
    const doorbell = play('doorbell', { 2: 'wrong-twice' });
    expect(readDogHandlingScore(doorbell)).toBe(800);
    expect(starsFor(800)).toBe(2);
  });

  it('gives 1 star from two failed beats', () => {
    const run = play('doorbell', { 0: 'timeout', 1: 'wrong-twice' });
    expect(readDogHandlingScore(run)).toBe(600);
    expect(starsFor(readDogHandlingScore(run))).toBe(1);
  });

  it('keeps a retried beat out of the failures but lowers tension', () => {
    const run = play('harness', { 0: 'wrong-once' });
    expect(readDogHandlingScore(run)).toBe(1000);
    expect(readDogMetrics(run).poste).toBe(1);
    expect(readDogMetrics(run).tension).toBeCloseTo(0.75);
  });

  it('lowers tension with every wrong choice, and never below 0', () => {
    const few = readDogMetrics(play('doorbell', { 0: 'wrong-once' })).tension;
    const many = readDogMetrics(play('doorbell', { 0: 'wrong-twice', 1: 'wrong-twice', 2: 'wrong-twice' })).tension;
    expect(many).toBeLessThan(few);
    expect(readDogMetrics(play('harness', { 0: 'wrong-twice', 1: 'wrong-twice', 2: 'wrong-twice', 3: 'wrong-twice' })).tension).toBe(0);
  });

  it('does not count a missed beat as a wrong choice', () => {
    const run = play('harness', { 0: 'timeout' });
    expect(readDogMetrics(run)).toEqual({ poste: 0.75, tension: 1 });
  });
});

describe('read the Dog text', () => {
  it('names every action and says what it does, for the button label read by screen readers', () => {
    for (const scene of SCENES) {
      for (const action of SCENE_ACTIONS[scene]) {
        expect(es[`minigame.action.${action}`]).toBeTruthy();
        expect(es[`minigame.actionHint.${action}`]).toBeTruthy();
      }
    }
  });

  it('has a hint for every Dog state, shown after a wrong choice', () => {
    for (const scene of ['harness', 'doorbell'] as const) {
      for (const state of Object.keys(CORRECT_ACTION[scene])) expect((es as Record<string, string>)[`minigame.hint.${state}`]).toBeTruthy();
    }
  });
});

describe('Basics scenes results and hints', () => {
  it('reports a perfect Basics run as timing 1 and tension 1, and lowers tension with more mistakes', () => {
    for (const scene of BASICS_SCENES) {
      const perfect = play(scene);
      expect(readDogMetrics(perfect)).toEqual({ timing: 1, tension: 1 });
      expect(readDogHandlingScore(perfect)).toBe(1000);
      const few = readDogMetrics(play(scene, { 0: 'wrong-once' })).tension;
      const many = readDogMetrics(play(scene, { 0: 'wrong-twice', 1: 'wrong-twice' })).tension;
      expect(few).toBeLessThan(1);
      expect(many).toBeLessThan(few);
    }
  });

  it('runs the three Basics Minigames on their scenes', () => {
    expect(readDogSceneOf('dog-as-dog')).toBe('affection');
    expect(readDogSceneOf('home-rest')).toBe('rest');
    expect(readDogSceneOf('calm-first')).toBe('calm');
    expect(readDogSceneOf('harness-ritual')).toBe('harness');
    expect(readDogSceneOf('poste-hold')).toBeUndefined();
  });

  it('has a catalog hint for every state and choice of every scene, and none tells the user to touch the Dog', () => {
    const touch = /\b(pega|pegar|golpe|patada|empuj|zarande|cachete|agarr|sujeta)/i;
    for (const scene of SCENES) {
      for (const state of Object.keys(CORRECT_ACTION[scene]) as (keyof (typeof CORRECT_ACTION)[typeof scene])[]) {
        for (const action of [null, ...SCENE_ACTIONS[scene]]) {
          const text = es[hintKey(scene, state as never, action)];
          expect(text).toBeTruthy();
          expect(text).not.toMatch(touch);
        }
      }
    }
  });

  it('says a Cuddle treats the Dog like a toy, and a Cue to an over-aroused Dog cannot teach yet', () => {
    expect(es[hintKey('affection', 'begging_lift', 'cuddle')]).toContain('peluche');
    expect(es[hintKey('calm', 'barking_nonstop', 'cue')]).toContain('así no puede aprender todavía');
    expect(es[hintKey('calm', 'zoomies', 'cue')]).toContain('así no puede aprender todavía');
    expect(hintKey('calm', 'relaxed_lying', 'cue')).toBe('minigame.calm.hint.marker');
  });

  it('has help text for every scene', () => {
    for (const scene of SCENES) expect((es as Record<string, string>)[`minigame.${scene}.help`]).toBeTruthy();
  });
});

describe('Home Behaviour scenes', () => {
  it('runs the three Home Minigames on their scenes', () => {
    expect(readDogSceneOf('bark-home')).toBe('bark-home');
    expect(readDogSceneOf('destroy')).toBe('destroy');
    expect(readDogSceneOf('eat-objects')).toBe('eat-objects');
  });

  it('gives each scene four beats, ends calm, and has exactly one right action for every state it shows', () => {
    for (const scene of HOME) {
      expect(READ_DOG.beats[scene]).toBe(4);
      const scripts = buildScripts(scene);
      for (const script of scripts) {
        expect(script).toHaveLength(4);
        expect(script[3]).toBe('relaxed_lying');
        for (const state of script) {
          const rights = SCENE_ACTIONS[scene].filter((a) => a === correctAction(scene, state));
          expect(rights).toHaveLength(1);
        }
      }
      expect(new Set(scripts.map((x) => x.join())).size).toBeGreaterThan(1);
    }
  });

  it('plays a perfect run to timing 1, tension 1 and 1000', () => {
    for (const scene of HOME) {
      const run = play(scene);
      expect(readDogMetrics(run)).toEqual({ timing: 1, tension: 1 });
      expect(readDogHandlingScore(run)).toBe(1000);
    }
  });

  it('shows no state without a posture, a label and a hint for every choice', () => {
    const touch = /\b(pega|pegar|golpe|patada|empuj|zarande|cachete|agarr|sujeta)/i;
    for (const scene of HOME) {
      for (const state of Object.keys(CORRECT_ACTION[scene]) as never[]) {
        expect(es[postureSpec(state).label]).toBeTruthy();
        for (const action of [null, ...SCENE_ACTIONS[scene]]) {
          const text = es[hintKey(scene, state, action)];
          expect(text).toBeTruthy();
          expect(text).not.toMatch(touch);
        }
      }
    }
  });

  it('never tells the user to chase or grab the Dog or what it holds', () => {
    expect(es['minigame.eat-objects.hint.wait']).toMatch(/no lo persigas/);
    expect(es['minigame.eat-objects.hint.swap']).toMatch(/no se lo quites/);
  });
});
