import Phaser from 'phaser';
import { createTranslator, es, type Catalog, type Translate } from '../src/i18n';
import { defaultScenario } from '../src/sim/config';
import {
  SHELL_MESSAGE_TYPES,
  createOutbox,
  decode,
  type ShellMessage,
} from '../src/sim/messages';
import { newSeed } from '../src/sim/rng';
import { validateScenario } from '../src/sim/scenery';
import { showPause, showResults } from './src/overlay';
import { StageScene, type StageOptions } from './src/StageScene';

const send = createOutbox(window as never);
const embedded = Boolean((window as { ReactNativeWebView?: unknown }).ReactNativeWebView) || window.parent !== window;

let t: Translate = createTranslator(es);
let closeOverlay: (() => void) | null = null;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0f172a',
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  scene: [],
  input: { activePointers: 3 },
});

game.scene.add('stage', StageScene, false);

function scene(): StageScene | undefined {
  return game.scene.getScene('stage') as StageScene | undefined;
}

function startStage(message: Extract<ShellMessage, { type: 'start' }> | null): void {
  closeOverlay?.();
  closeOverlay = null;
  const catalog: Catalog | undefined = message?.catalog;
  t = createTranslator(catalog ?? es);
  const options: StageOptions = {
    seed: message?.seed ?? newSeed(),
    scenario: { ...defaultScenario, ...message?.scenario },
    t,
    onCue: (cueType) => send({ type: 'playCue', cueType }),
    onTier: (tier, time) => send({ type: 'reaction-tier-change', tier, time }),
    onSignal: (signal, time) => send({ type: 'stage-signal', signal, time }),
    onEnd: (payload) => {
      send({ type: 'debrief', payload });
      if (!embedded) closeOverlay = showResults(t, payload, () => startStage(null));
    },
  };
  const problems = validateScenario(options.scenario);
  if (problems.length > 0) console.warn('scenario problems:', problems.join('; '));
  game.scene.start('stage', options);
}

function pause(): void {
  const s = scene();
  if (!s || s.isPaused || s.isEnded || !game.scene.isActive('stage')) return;
  s.pauseStage();
  send({ type: 'paused' });
  if (!embedded) closeOverlay = showPause(t, resume);
}

function resume(): void {
  closeOverlay?.();
  closeOverlay = null;
  scene()?.resumeStage();
  window.focus();
}

function onMessage(raw: unknown): void {
  const message = decode<ShellMessage>(raw, SHELL_MESSAGE_TYPES);
  if (!message) return;
  if (message.type === 'start') startStage(message);
  else if (message.type === 'pause') pause();
  else resume();
}

window.addEventListener('message', (e) => onMessage(e.data));
document.addEventListener('message', ((e: MessageEvent) => onMessage(e.data)) as EventListener); // Android WebView
document.addEventListener('visibilitychange', () => document.hidden && pause());
window.addEventListener('blur', pause);
window.addEventListener('error', (e) => send({ type: 'error', message: e.message }));

game.events.once(Phaser.Core.Events.READY, () => {
  send({ type: 'ready' });
  if (!embedded) startStage(null);
});

// debug handle for scripted checks in a desktop browser
(window as unknown as { __leadmate: unknown }).__leadmate = { game, scene, startStage };
