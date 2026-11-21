import * as path from 'node:path';
import { defaultScenario, type ScenarioConfig } from '../../sim/config';
import { buildPayload } from '../../sim/payload';
import { createState, noInput, tick, type SimState } from '../../sim/sim';
import { newDogRecord } from '../dogRecord';
import { advance, onDebrief, pickExercise, startNode, type NodeRun } from '../nodes/node';
import { isImageDuelQuestion } from '../nodes/content';
import { payloadWith } from '../testPayload';
import { findWorld, hasMoreComing } from '../world';
import { loadPackFromDisk } from './loader';
import { resolvePack } from './resolver';
import { setActiveContent } from './runtime';
import { validatePack } from './validator';

const BETA = path.join(__dirname, '../../../content/beta');
const pack = loadPackFromDisk(BETA);
const NODE = 'park-unpredictable';

afterEach(() => setActiveContent(null));

describe('World 6 Stage Node park-unpredictable (beta)', () => {
  it('the beta pack validates with no errors and needs app >= 1.3.0 (Encounter Series / Cafe World)', () => {
    expect(validatePack(pack).errors).toEqual([]);
    expect(pack.pack.minAppVersion).toBe('1.4.0');
  });

  it.each(['es', 'en'])('loads in %s with a 3-question Checkpoint: text, one Image Duel, text', (lang) => {
    const node = resolvePack(pack, lang).nodes.find((n) => n.id === NODE)!;
    expect(node).toBeDefined();
    expect(node.checkpoint).toHaveLength(3);
    expect(node.checkpoint.map(isImageDuelQuestion)).toEqual([false, true, false]);
    const duel = node.checkpoint[1] as any;
    expect(duel.images).toHaveLength(2);
    expect(duel.images[duel.correct].file ?? duel.images[duel.correct].art ?? JSON.stringify(duel.images[duel.correct])).toContain('turn-look');
    expect(node.exercises.map((e) => e.metric)).toEqual(['tension', 'attention']);
  });

  it('offers the structured cue and is exempt from Sintonía', () => {
    const scenario = pack.nodes[NODE].config.simulation!.scenario as ScenarioConfig;
    expect(scenario.cues).toEqual(['lets-go']);
    expect(scenario.sintonia.enabled).toBe(false);
    expect(scenario.waypoints.length).toBeGreaterThanOrEqual(4);
  });

  it('a sharp turn on a Slack leash shows no Sintonía and counts no Rigid Pull', () => {
    const scenario = { ...(pack.nodes[NODE].config.simulation!.scenario as ScenarioConfig), leashLength: 100, dogGoalSpeed: 0 };
    const s: SimState = createState(1, scenario);
    for (let i = 0; i < 60 * 8; i++) tick(s, { direction: { x: Math.floor(s.time / 2) % 2 === 0 ? 1 : -1, y: 0 }, strength: 0.6, marker: false });
    expect(s.telemetry.sintoniaTime).toBe(0);
    expect(s.telemetry.rigidTime).toBe(0);
    expect(buildPayload(s).sintoniaTimeSeconds).toBe(0);
    // the same walk in the default (non-exempt) scenario is not touched by the flag
    expect(defaultScenario.sintonia.enabled).not.toBe(false);
    void noInput;
  });

  it('the Debrief offers one exercise for the weaker metric and the Mission shows it as "Tu foco"', () => {
    const resolved = resolvePack(pack, 'es');
    setActiveContent({ channel: 'beta', isBaseline: false, contentVersion: 4, pack, resolved, language: 'es' });
    const node = resolved.nodes.find((n) => n.id === NODE)!;
    const finished = (over = {}): NodeRun => ({ ...startNode(node), step: 'debrief', result: { kind: 'stage', payload: payloadWith(over) } });
    void advance;
    const tense = finished({ pullPercentage: 90, checkInHits: 2 });
    expect(pickExercise(node, tense.result!).metric).toBe('tension');
    const inattentive = finished({ pullPercentage: 0, checkInHits: 0 });
    expect(pickExercise(node, inattentive.result!).metric).toBe('attention');
    const after = onDebrief(newDogRecord(), inattentive, new Date(2026, 4, 1, 10));
    expect(after.missions['mission-park-unpredictable'].focus).toBe('node.unpredictable.exercise2');
    expect(resolved.catalog['node.unpredictable.exercise2']).toBeTruthy();
  });

  it('Mission has one target, success and ES/EN problems', () => {
    for (const lang of ['es', 'en']) {
      const mission = resolvePack(pack, lang).missions.find((m) => m.id === 'mission-park-unpredictable')!;
      expect(mission).toBeDefined();
      expect(mission.reps).toBe(1);
      expect(mission.problems.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('World 6 is three Stretches in order, no longer a preview, with more Stretches coming', () => {
    const resolved = resolvePack(pack, 'es');
    const world = resolved.worlds.find((w) => w.id === 'recall')!;
    expect(world.preview).toBeFalsy();
    expect(world.stretches).toHaveLength(3);
    expect(world.stretches[0].map((s) => s.id)).toEqual(['theory-sniffing-walks', 'park-nose-on', 'mission-park-sniff']);
    expect(world.stretches[1].map((s) => s.id)).toEqual(['theory-unpredictable-walks', 'howto-yield-pressure', NODE, 'park-keep-fresh', 'mission-park-unpredictable']);
    expect(world.stretches[2].map((s) => s.id)).toEqual(['theory-sniffing-on-your-terms', 'howto-jackpot', 'park-plant-mark', 'park-not-that-one', 'mission-park-sniff-terms']);
    expect(hasMoreComing(world)).toBe(true);
    void findWorld;
  });
});
