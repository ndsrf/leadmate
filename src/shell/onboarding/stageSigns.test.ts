import { en, es } from '../../i18n';
import { dogPose } from '../../hud/pose';
import { dogSignsShown } from '../../hud/dogSigns';
import { iconForKind } from '../../hud/effectsPool';
import { defaultScenario, type ScenarioConfig } from '../../sim/config';
import { FEEDBACK_ACTION_KINDS, STARTING_KINDS } from '../../sim/feedbackKinds';
import { DOG_SIGNS } from '../../sim/messages';
import { createState, noInput, tick, type SimInput } from '../../sim/sim';
import { HINT_IDS } from './hints';
import { INTRO_NODE } from './introNode';
import { STAGE_SIGNS } from './stageSigns';

const scenario: ScenarioConfig = { ...defaultScenario, ...INTRO_NODE.simulation.scenario };

/** Walks the guided first scenario like a player (stops for the Distractor, taps Marker after a Fixation) and records the Dog signs shown. */
function signsSeen(seed: number): Set<string> {
  const state = createState(seed, scenario);
  const seen = new Set<string>();
  let fixated = false;
  let stoppedFor = 0;
  while (!state.ended && state.time < 60) {
    const near = state.distractor.active && !state.distractor.finished && Math.hypot(state.distractor.pos.x - state.dog.x, state.distractor.pos.y - state.dog.y) < 8;
    const stop = near && stoppedFor < 4;
    if (stop) stoppedFor += state.config.fixedStep;
    const input: SimInput = stop ? noInput : { direction: { x: 1, y: 0 }, strength: 1, marker: fixated && state.time % 1 < 0.02 };
    for (const e of tick(state, input)) if (e.type === 'fixation-start') fixated = true;
    const shown = dogSignsShown(state, dogPose(state));
    if (shown.fixation) seen.add('fixation');
    for (const sign of shown.signs) seen.add(sign);
  }
  return seen;
}

describe('stage sign inventory', () => {
  it('lists every Dog sign the scene can draw', () => {
    const listed = STAGE_SIGNS.flatMap((s) => (s.dogSign ? [s.dogSign] : []));
    expect(new Set(listed)).toEqual(new Set(['fixation', ...DOG_SIGNS]));
  });

  it('explains every Dog sign the guided first scenario reaches in seeds 1 to 8, and lists the unreachable ones as exempt', () => {
    const reached = new Set<string>();
    for (let seed = 1; seed <= 8; seed++) for (const sign of signsSeen(seed)) reached.add(sign);
    for (const entry of STAGE_SIGNS.filter((s) => s.dogSign)) {
      if (reached.has(entry.dogSign!)) {
        expect({ id: entry.id, explained: entry.hint !== undefined || entry.overview !== undefined, exempt: entry.exempt }).toEqual({ id: entry.id, explained: true, exempt: undefined });
      } else {
        expect({ id: entry.id, exempt: typeof entry.exempt }).toEqual({ id: entry.id, exempt: 'string' });
      }
    }
    // the Fixation is the one the whole change is about
    expect(reached.has('fixation')).toBe(true);
  });

  it('lists the icon and kind of every Feedback Message the guided first Stage can show', () => {
    for (const kind of STARTING_KINDS) {
      const frame = iconForKind(kind, FEEDBACK_ACTION_KINDS[kind]);
      const entry = STAGE_SIGNS.find((s) => s.feedbackKinds?.includes(kind));
      expect({ kind, listed: entry !== undefined }).toEqual({ kind, listed: true });
      expect({ kind, frame, covered: entry?.frames?.includes(frame) }).toEqual({ kind, frame, covered: true });
      expect(entry?.exempt).toBeUndefined();
    }
  });

  it('lists the frame of every Introduced kind, but only Introduced kinds are explained', () => {
    for (const entry of STAGE_SIGNS.filter((s) => s.feedbackKinds)) {
      const introduced = entry.feedbackKinds!.some((k) => (STARTING_KINDS as readonly string[]).includes(k));
      expect({ id: entry.id, exempt: entry.exempt !== undefined }).toEqual({ id: entry.id, exempt: !introduced });
    }
  });

  it('gives every sign a Hint or an overview line, unless it is exempt with a reason', () => {
    for (const entry of STAGE_SIGNS) {
      if (entry.exempt !== undefined) {
        expect({ id: entry.id, reason: entry.exempt.length > 0, explained: entry.hint ?? entry.overview ?? null }).toEqual({ id: entry.id, reason: true, explained: null });
      } else {
        expect({ id: entry.id, explained: entry.hint !== undefined || entry.overview !== undefined }).toEqual({ id: entry.id, explained: true });
      }
    }
  });

  it('points only at Hints and overview lines that exist', () => {
    for (const entry of STAGE_SIGNS) {
      if (entry.hint?.startsWith('feedback:')) expect(Object.keys(FEEDBACK_ACTION_KINDS)).toContain(entry.hint.slice('feedback:'.length));
      else if (entry.hint) expect(HINT_IDS as readonly string[]).toContain(entry.hint);
      if (entry.overview) {
        expect(en[entry.overview]).toBeTruthy();
        expect(es[entry.overview]).toBeTruthy();
      }
    }
  });

  it('has unique ids', () => {
    const ids = STAGE_SIGNS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('the Primer overview card', () => {
  it.each([['en', en], ['es', es]] as const)('has a label for every sign with an overview line (%s)', (_lang, catalog) => {
    const card = catalog['node.intro.cardSigns'];
    for (const entry of STAGE_SIGNS.filter((s) => s.overview && !s.exempt)) {
      expect({ id: entry.id, labelled: card.includes(catalog[entry.overview!]) }).toEqual({ id: entry.id, labelled: true });
    }
  });

  it('is the card after the movement controls card in the guided first Stage Primer', () => {
    const texts = INTRO_NODE.primerCards.map((c) => (typeof c === 'string' ? c : c.text));
    expect(texts[texts.indexOf('node.intro.card2') + 1]).toBe('node.intro.cardSigns');
  });
});
