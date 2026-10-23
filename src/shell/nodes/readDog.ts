import { createRng } from '../../sim/rng';

/**
 * The "read the Dog, pick the action" Minigame behind the Harness Ritual and the Doorbell Mat. A scene
 * is a short list of Action beats; in each one the Dog shows a state and exactly one action fits it.
 */
export const READ_DOG = {
  /** Seconds the user has to decide on a beat; generous, nobody should panic. */
  decisionSeconds: 5,
  /** Beats in a scene. */
  beats: { harness: 4, doorbell: 5 },
} as const;

export type ReadDogScene = 'harness' | 'doorbell';
export type ReadDogAction = 'wait' | 'cue' | 'marker' | 'harness' | 'mat';

/** What the Dog shows in a beat; each is also a posture in `ui/canine.ts`. */
export type DogState = 'jumping' | 'alert_barking' | 'staring_door' | 'sniffing' | 'sitting_attentive' | 'unsettled_on_mat' | 'relaxed_lying';

/** The buttons of a scene, in the order they are laid out. */
export const SCENE_ACTIONS: Record<ReadDogScene, readonly ReadDogAction[]> = {
  harness: ['wait', 'cue', 'marker', 'harness'],
  doorbell: ['wait', 'cue', 'marker', 'mat'],
};

/** The right action for each Dog state, defined once; a script is only a list of states. */
export const CORRECT_ACTION: Record<DogState, ReadDogAction> = {
  jumping: 'wait',
  alert_barking: 'mat',
  staring_door: 'mat',
  sniffing: 'cue',
  sitting_attentive: 'harness',
  unsettled_on_mat: 'wait',
  relaxed_lying: 'marker',
};

/**
 * The beats of a scene for a seed. Harness Ritual: jumping (Wait), sniffing (Cue), sitting and looking
 * up (Put on harness), relaxed with the harness on (Marker). Doorbell Mat: barking or staring at the
 * door (Send to mat), unsettled and sniffing in some order (Wait, Cue), relaxed on the mat (Marker).
 * The seed changes the order and the opening state; every scene ends with the Dog calm.
 */
export function buildScript(scene: ReadDogScene, seed: number): DogState[] {
  const rng = createRng(seed * 131 + (scene === 'harness' ? 7 : 13));
  if (scene === 'harness') {
    const opening: DogState[] = rng.next() < 0.5 ? ['jumping', 'sniffing'] : ['sniffing', 'jumping'];
    return [...opening, 'sitting_attentive', 'relaxed_lying'];
  }
  const middles: DogState[][] = [
    ['unsettled_on_mat', 'sniffing', 'unsettled_on_mat'],
    ['sniffing', 'unsettled_on_mat', 'unsettled_on_mat'],
    ['unsettled_on_mat', 'unsettled_on_mat', 'sniffing'],
  ];
  const entry: DogState = rng.next() < 0.5 ? 'alert_barking' : 'staring_door';
  return [entry, ...middles[Math.floor(rng.next() * middles.length) % middles.length], 'relaxed_lying'];
}

/** How a beat ended: `failed` is still wrong after its one retry, `missed` ran out of time without a choice. */
export type BeatOutcome = 'correct' | 'failed' | 'missed';

/** What the last step did, so the view can react once; `seq` rises with every event. */
export interface ReadDogEvent {
  seq: number;
  kind: 'correct' | 'wrong' | 'failed' | 'missed';
  action: ReadDogAction | null;
  /** The Dog state the event was about. */
  state: DogState;
}

export interface ReadDogRun {
  scene: ReadDogScene;
  script: DogState[];
  /** Index of the current beat. */
  index: number;
  /** Seconds into the current decision window. */
  t: number;
  /** Wrong choices made on the current beat; one retry is allowed. */
  mistakes: number;
  outcomes: BeatOutcome[];
  /** Every wrong choice of the scene, retries included. */
  wrongChoices: number;
  last: ReadDogEvent | null;
  done: boolean;
}

export function newReadDog(scene: ReadDogScene, seed: number): ReadDogRun {
  return { scene, script: buildScript(scene, seed), index: 0, t: 0, mistakes: 0, outcomes: [], wrongChoices: 0, last: null, done: false };
}

/** The Dog state of the current beat, or the last one once the scene is over. */
export function currentState(run: ReadDogRun): DogState {
  return run.script[Math.min(run.index, run.script.length - 1)];
}

/** Whether the harness is on the Dog: only after Put on harness was right on its beat. */
export function harnessOn(run: ReadDogRun): boolean {
  return run.scene === 'harness' && run.script.some((state, i) => CORRECT_ACTION[state] === 'harness' && run.outcomes[i] === 'correct');
}

function event(run: ReadDogRun, kind: ReadDogEvent['kind'], action: ReadDogAction | null): ReadDogEvent {
  return { seq: (run.last?.seq ?? 0) + 1, kind, action, state: currentState(run) };
}

function closeBeat(run: ReadDogRun, outcome: BeatOutcome, last: ReadDogEvent): ReadDogRun {
  const outcomes = [...run.outcomes, outcome];
  return { ...run, outcomes, index: run.index + 1, t: 0, mistakes: 0, last, done: outcomes.length >= run.script.length };
}

/**
 * Advances by `dt` seconds; `action` is the button pressed during this step, if any. A right action
 * closes the beat as correct. A wrong one counts a mistake and reopens the beat once; a second wrong
 * one closes it as failed. Running out of the decision window closes it as failed after a mistake,
 * missed otherwise. Pure.
 */
export function stepReadDog(run: ReadDogRun, dt: number, action: ReadDogAction | null): ReadDogRun {
  if (run.done) return run;
  const t = run.t + dt;
  if (action !== null) {
    if (action === CORRECT_ACTION[currentState(run)]) return closeBeat(run, 'correct', event(run, 'correct', action));
    const wrongChoices = run.wrongChoices + 1;
    if (run.mistakes >= 1) return closeBeat({ ...run, wrongChoices }, 'failed', event(run, 'failed', action));
    return { ...run, wrongChoices, mistakes: 1, t: 0, last: event(run, 'wrong', action) };
  }
  if (t >= READ_DOG.decisionSeconds) {
    return run.mistakes > 0 ? closeBeat(run, 'failed', event(run, 'failed', null)) : closeBeat(run, 'missed', event(run, 'missed', null));
  }
  return { ...run, t };
}

const failedBeats = (run: ReadDogRun) => run.outcomes.filter((o) => o !== 'correct').length;

/**
 * Metrics for the Debrief: the share of correct beats (`poste` for the Harness Ritual, `timing` for the
 * Doorbell Mat, the names the Debrief already uses) and `tension`, which falls with every wrong choice.
 */
export function readDogMetrics(run: ReadDogRun): { poste?: number; timing?: number; tension: number } {
  const beats = Math.max(1, run.script.length);
  const correct = run.outcomes.filter((o) => o === 'correct').length / beats;
  return { ...(run.scene === 'harness' ? { poste: correct } : { timing: correct }), tension: Math.max(0, 1 - run.wrongChoices / beats) };
}

/** The handling score (0-1000) fed to the star rating: 1000 minus the share of failed beats. */
export function readDogHandlingScore(run: ReadDogRun): number {
  return Math.round(1000 * (1 - failedBeats(run) / Math.max(1, run.script.length)));
}
