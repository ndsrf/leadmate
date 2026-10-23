import { buildScript, CORRECT_ACTION, currentState, harnessOn, newReadDog, READ_DOG, readDogHandlingScore, readDogMetrics, SCENE_ACTIONS, stepReadDog, type ReadDogAction, type ReadDogRun, type ReadDogScene } from './readDog';
import { es } from '../../i18n';
import { starsFor } from '../stars';

const SCENES: ReadDogScene[] = ['harness', 'doorbell'];

const right = (run: ReadDogRun) => stepReadDog(run, 0.05, CORRECT_ACTION[currentState(run)]);
const wrongFor = (run: ReadDogRun): ReadDogAction => SCENE_ACTIONS[run.scene].find((a) => a !== CORRECT_ACTION[currentState(run)])!;
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
        expect(CORRECT_ACTION[script[script.length - 1]]).toBe('marker');
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
      const needed = new Set(buildScripts(scene).flatMap((script) => script.map((s) => CORRECT_ACTION[s])));
      for (const action of SCENE_ACTIONS[scene]) expect(needed.has(action)).toBe(true);
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
      for (const script of buildScripts(scene)) for (const state of script) expect(SCENE_ACTIONS[scene]).toContain(CORRECT_ACTION[state]);
    }
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
    while (CORRECT_ACTION[currentState(run)] !== 'harness') {
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
    for (const state of Object.keys(CORRECT_ACTION) as (keyof typeof CORRECT_ACTION)[]) expect(es[`minigame.hint.${state}`]).toBeTruthy();
  });
});
