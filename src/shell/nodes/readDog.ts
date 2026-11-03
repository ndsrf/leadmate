import type { TextKey } from '../../i18n';
import { createRng } from '../../sim/rng';
import type { MinigameKind, NodeDef } from './node';

/**
 * The "read the Dog, pick the action" Minigame behind the Harness Ritual, the Doorbell Mat and the three
 * Basics scenes. A scene is a short list of Action beats; in each one the Dog shows a state and exactly one
 * action fits it.
 */
export const READ_DOG = {
  /** Seconds the user has to decide on a beat; generous, nobody should panic. */
  decisionSeconds: 5,
  /** Beats in a scene. */
  beats: { harness: 4, doorbell: 5, affection: 4, rest: 4, calm: 4, 'bark-home': 4, destroy: 4, 'eat-objects': 4 },
} as const;

/** `affection` is "Dog as a dog", `rest` is "Home rest", `calm` is "Calm first": the Basics World scenes. */
export type ReadDogScene = 'harness' | 'doorbell' | 'affection' | 'rest' | 'calm' | 'bark-home' | 'destroy' | 'eat-objects';
export type ReadDogAction = 'wait' | 'cue' | 'marker' | 'harness' | 'mat' | 'ignore' | 'send-bed' | 'send-away' | 'go-outside' | 'cuddle' | 'block-view' | 'tidy' | 'swap';

/** What the Dog shows in a beat; each is also a posture in `ui/canine.ts`. */
export type DogState =
  | 'jumping' | 'alert_barking' | 'staring_door' | 'sniffing' | 'sitting_attentive' | 'unsettled_on_mat' | 'relaxed_lying'
  | 'begging_lift' | 'on_furniture' | 'nudging_attention' | 'toy_indoors' | 'resting' | 'barking_nonstop' | 'zoomies'
  | 'barking_window' | 'barking_at_you' | 'chewing_object' | 'eyeing_item' | 'holding_item';

/** The buttons of a scene, in the order they are laid out. */
export const SCENE_ACTIONS: Record<ReadDogScene, readonly ReadDogAction[]> = {
  harness: ['wait', 'cue', 'marker', 'harness'],
  doorbell: ['wait', 'cue', 'marker', 'mat'],
  affection: ['ignore', 'send-bed', 'marker', 'cuddle'],
  rest: ['ignore', 'send-away', 'marker', 'go-outside'],
  calm: ['wait', 'send-away', 'marker', 'cue'],
  'bark-home': ['block-view', 'ignore', 'wait', 'marker'],
  destroy: ['tidy', 'swap', 'ignore', 'marker'],
  'eat-objects': ['tidy', 'swap', 'wait', 'marker'],
};

/**
 * The right action for each Dog state a scene shows, defined once per scene: the same state can mean different
 * things in different scenes (sitting and looking up is Put on harness in the Harness Ritual, Cue in Calm first).
 * A script is only a list of states. Cuddle is right for no state.
 */
export const CORRECT_ACTION: { readonly [S in ReadDogScene]: Partial<Record<DogState, ReadDogAction>> } = {
  harness: { jumping: 'wait', sniffing: 'cue', sitting_attentive: 'harness', relaxed_lying: 'marker' },
  doorbell: { alert_barking: 'mat', staring_door: 'mat', sniffing: 'cue', unsettled_on_mat: 'wait', relaxed_lying: 'marker' },
  affection: { begging_lift: 'ignore', on_furniture: 'send-bed', relaxed_lying: 'marker' },
  rest: { nudging_attention: 'send-away', toy_indoors: 'go-outside', resting: 'ignore', relaxed_lying: 'marker' },
  calm: { barking_nonstop: 'wait', zoomies: 'send-away', sitting_attentive: 'cue', relaxed_lying: 'marker' },
  'bark-home': { barking_window: 'block-view', barking_at_you: 'ignore', barking_nonstop: 'wait', relaxed_lying: 'marker' },
  destroy: { sniffing: 'tidy', chewing_object: 'swap', resting: 'ignore', relaxed_lying: 'marker' },
  'eat-objects': { eyeing_item: 'tidy', holding_item: 'swap', zoomies: 'wait', relaxed_lying: 'marker' },
};

/** The right action for a state in a scene; undefined for a state the scene never shows. */
export function correctAction(scene: ReadDogScene, state: DogState): ReadDogAction | undefined {
  return CORRECT_ACTION[scene][state];
}

/** The Minigames that run on this engine, and their scene. */
export const SCENE_OF_MINIGAME = {
  'harness-ritual': 'harness',
  'doorbell-mat': 'doorbell',
  'dog-as-dog': 'affection',
  'home-rest': 'rest',
  'calm-first': 'calm',
  'bark-home': 'bark-home',
  destroy: 'destroy',
  'eat-objects': 'eat-objects',
} as const satisfies Partial<Record<MinigameKind, ReadDogScene>>;

/** The read-dog scene a Minigame runs, or undefined for a Minigame on another engine. */
export function readDogSceneOf(kind: MinigameKind | undefined): ReadDogScene | undefined {
  return kind && kind in SCENE_OF_MINIGAME ? SCENE_OF_MINIGAME[kind as keyof typeof SCENE_OF_MINIGAME] : undefined;
}

/** The Basics World scenes, set in a home living room. */
export const BASICS_SCENES: readonly ReadDogScene[] = ['affection', 'rest', 'calm'];

export const isBasicsScene = (scene: ReadDogScene) => BASICS_SCENES.includes(scene);

/** The Home Behaviour scenes (barking at home, destroying things, eating non-food things), also set in a living room. */
export const HOME_SCENES: readonly ReadDogScene[] = ['bark-home', 'destroy', 'eat-objects'];

export const isHomeScene = (scene: ReadDogScene) => HOME_SCENES.includes(scene);

/** Scenes drawn in the living room and hinted per scene and right action. */
export const isLivingRoomScene = (scene: ReadDogScene) => isBasicsScene(scene) || isHomeScene(scene);

/** The how-to-play Lesson that explains "read the Dog, pick the action"; every living-room Node needs it read. */
export const HOWTO_ACTION_LESSON = 'howto-choose-action';

/** The Lessons that must be read before a Node can be played: the how-to-play Lesson for a living-room read-the-Dog Node. */
export function requiredLessonsOf(node: Pick<NodeDef, 'simulation' | 'opensAfterLesson'>): string[] {
  if (node.opensAfterLesson) return [node.opensAfterLesson];
  const scene = readDogSceneOf(node.simulation.minigame);
  return scene && isLivingRoomScene(scene) ? [HOWTO_ACTION_LESSON] : [];
}

/** States in which a Dog is too aroused to learn: a Cue is ignored. */
const OVER_AROUSED: readonly DogState[] = ['barking_nonstop', 'zoomies'];

/**
 * The one-line hint after a wrong choice or a missed beat. The Harness Ritual and Doorbell Mat name what to look
 * for in the state (`minigame.hint.<state>`). A Basics or Home Behaviour scene names it per scene and right action
 * (`minigame.<scene>.hint.<action>`), except that a Cuddle says it treats the Dog like a toy and a Cue to a Dog
 * barking nonstop or racing around says it cannot learn yet.
 */
export function hintKey(scene: ReadDogScene, state: DogState, action: ReadDogAction | null): TextKey {
  if (!isLivingRoomScene(scene)) return `minigame.hint.${state}` as TextKey;
  if (action === 'cuddle') return 'minigame.hint.cuddle';
  if (scene === 'calm' && action === 'cue' && OVER_AROUSED.includes(state)) return 'minigame.calm.hint.tooAroused';
  return `minigame.${scene}.hint.${correctAction(scene, state)}` as TextKey;
}

const SCENE_SALT: Record<ReadDogScene, number> = { harness: 7, doorbell: 13, affection: 17, rest: 19, calm: 23, 'bark-home': 29, destroy: 31, 'eat-objects': 37 };

/**
 * The beats of a scene for a seed. Harness Ritual: jumping (Wait), sniffing (Cue), sitting and looking
 * up (Put on harness), relaxed with the harness on (Marker). Doorbell Mat: barking or staring at the
 * door (Send to mat), unsettled and sniffing in some order (Wait, Cue), relaxed on the mat (Marker).
 * Dog as a dog: pawing to be lifted (Ignore) and on the sofa (Send to bed) in some order, one of them
 * again, then lying on its own bed (Marker). Home rest: nudging (Send away) and a toy indoors (Go outside)
 * in some order, resting (Ignore), then lying on its bed after being sent (Marker). Calm first: barking
 * nonstop (Wait) and zoomies (Send away) in some order, sitting calm (Cue), then lying relaxed (Marker).
 * Barking at home: barking at the window (Block the view), barking at you for attention (Ignore) and barking
 * nonstop (Wait) in a seeded order, then lying relaxed (Marker). Destroying things: sniffing around things within reach
 * (Put away) and chewing one (Swap) in some order, resting (Ignore), then relaxed (Marker). Eating non-food things:
 * eyeing an item (Put away), holding one (Swap) and running off with it (Wait, never chase) in a seeded order, then
 * relaxed (Marker).
 * The seed changes the order and the opening state; every scene ends with the Dog calm.
 */
export function buildScript(scene: ReadDogScene, seed: number): DogState[] {
  const rng = createRng(seed * 131 + SCENE_SALT[scene]);
  const pair = (a: DogState, b: DogState): DogState[] => (rng.next() < 0.5 ? [a, b] : [b, a]);
  const shuffle = (states: DogState[]): DogState[] => {
    const out = [...states];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  switch (scene) {
    case 'harness':
      return [...pair('jumping', 'sniffing'), 'sitting_attentive', 'relaxed_lying'];
    case 'affection': {
      const opening = pair('begging_lift', 'on_furniture');
      return [...opening, opening[Math.floor(rng.next() * 2) % 2], 'relaxed_lying'];
    }
    case 'rest':
      return [...pair('nudging_attention', 'toy_indoors'), 'resting', 'relaxed_lying'];
    case 'calm':
      return [...pair('barking_nonstop', 'zoomies'), 'sitting_attentive', 'relaxed_lying'];
    case 'bark-home':
      return [...shuffle(['barking_window', 'barking_at_you', 'barking_nonstop']), 'relaxed_lying'];
    case 'destroy':
      return [...pair('sniffing', 'chewing_object'), 'resting', 'relaxed_lying'];
    case 'eat-objects':
      return [...shuffle(['eyeing_item', 'holding_item', 'zoomies']), 'relaxed_lying'];
    case 'doorbell':
      break;
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
  return run.scene === 'harness' && run.script.some((state, i) => correctAction(run.scene, state) === 'harness' && run.outcomes[i] === 'correct');
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
    if (action === correctAction(run.scene, currentState(run))) return closeBeat(run, 'correct', event(run, 'correct', action));
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
 * Doorbell Mat and the Basics scenes, the names the Debrief already uses) and `tension`, which falls with every wrong choice.
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
