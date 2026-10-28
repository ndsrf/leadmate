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

/**
 * Pace the loop with a 30 Hz timer instead of the display's requestAnimationFrame, so a 90/120 Hz screen wakes JS
 * about 30 times a second rather than at its refresh rate only to skip most frames. Set to false if a device
 * judders; `?pace=raf` or `?pace=timer` in the page address overrides it for a side-by-side check.
 */
const PACE_WITH_TIMER = true;
const pace = new URLSearchParams(location.search).get('pace');
const paceWithTimer = pace === 'raf' ? false : pace === 'timer' ? true : PACE_WITH_TIMER;

// Power: at most 30 frames/s whatever the display refresh (the simulation steps at its own fixed rate), no
// antialiasing, low-power GPU, no audio engine (the shell plays every sound). Phaser renders at CSS pixels (no
// devicePixelRatio scaling), so the pixel count is already bounded on dense screens.
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0f172a',
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  scene: [],
  input: { activePointers: 3 },
  // limit sits just above 30: Phaser skips a frame when the accumulated delta is below 1000/limit, and two 60 Hz
  // frames (33.3 ms) are too close to 33.3 for it to hold 30 reliably
  fps: { target: 30, limit: 32, forceSetTimeOut: paceWithTimer },
  render: { antialias: false, powerPreference: 'low-power' },
  audio: { noAudio: true },
});

/**
 * Loop wakeups, frames actually drawn and simulation steps, for the dev readout and the scripted regression check.
 * `loop.frame` counts every requestAnimationFrame/timer callback, including the ones the fps limit skips (PRE_STEP
 * only fires for frames that pass it).
 */
const perf = { frames: 0, get wakes() { return game.loop.frame; }, steps: () => scene()?.simSteps ?? 0 };
game.events.on(Phaser.Core.Events.POST_RENDER, () => perf.frames++);

// One owner decides whether the render loop runs. It sleeps when no Stage is on screen (shell said so), the app or
// tab is hidden, or the Stage is paused or ended; the frame that shows a paused/ended state is drawn first.
let suspended = embedded; // an embedded bundle idles until the shell starts a Stage
let starting = false; // a Stage was just started and its scene has not been created yet
let sleepPending = false;

function shouldRun(): boolean {
  if (suspended || document.hidden) return false;
  if (starting) return true;
  const s = scene();
  return Boolean(s) && game.scene.isActive('stage') && !s!.isPaused && !s!.isEnded;
}

function sleepAfterFrame(): void {
  if (sleepPending) return;
  sleepPending = true;
  game.events.once(Phaser.Core.Events.POST_RENDER, () => {
    sleepPending = false;
    if (!shouldRun()) game.loop.sleep();
  });
}

function setRunning(): void {
  if (shouldRun()) {
    if (!game.loop.running) {
      game.loop.wake();
      game.loop.resetDelta();
    }
  } else if (suspended || document.hidden) {
    game.loop.sleep();
  } else if (game.loop.running) {
    sleepAfterFrame();
  }
}

/** One more frame while asleep, e.g. after a resize, then back to sleep. */
function drawOnce(): void {
  if (suspended || document.hidden || game.loop.running) return;
  game.loop.wake();
  game.loop.resetDelta();
  sleepAfterFrame();
}
// Phaser handles window resizes inside its step (the dirty flag), so a sleeping loop must run for a frame
window.addEventListener('resize', drawOnce);
window.addEventListener('orientationchange', drawOnce);

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
    onReady: () => {
      starting = false;
      setRunning();
    },
    onEnd: (payload) => {
      setRunning();
      send({ type: 'debrief', payload });
      if (!embedded) closeOverlay = showResults(t, payload, () => startStage(null));
    },
  };
  const problems = validateScenario(options.scenario);
  if (problems.length > 0) console.warn('scenario problems:', problems.join('; '));
  suspended = false;
  starting = true;
  setRunning();
  game.scene.start('stage', options);
}

function pause(): void {
  const s = scene();
  if (!s || s.isPaused || s.isEnded || !game.scene.isActive('stage')) return;
  s.pauseStage();
  setRunning();
  send({ type: 'paused' });
  if (!embedded) closeOverlay = showPause(t, resume);
}

function resume(): void {
  closeOverlay?.();
  closeOverlay = null;
  scene()?.resumeStage();
  setRunning();
  window.focus();
}

function onMessage(raw: unknown): void {
  const message = decode<ShellMessage>(raw, SHELL_MESSAGE_TYPES);
  if (!message) return;
  if (message.type === 'start') startStage(message);
  else if (message.type === 'pause') pause();
  else if (message.type === 'focus') scene()?.focusCamera();
  else if (message.type === 'suspend') {
    suspended = true;
    setRunning();
  } else if (message.type === 'wake') {
    suspended = false;
    setRunning();
  } else resume();
}

window.addEventListener('message', (e) => onMessage(e.data));
document.addEventListener('message', ((e: MessageEvent) => onMessage(e.data)) as EventListener); // Android WebView
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pause();
  setRunning();
});
window.addEventListener('blur', pause);
window.addEventListener('error', (e) => send({ type: 'error', message: e.message }));

game.events.once(Phaser.Core.Events.READY, () => {
  send({ type: 'ready' });
  if (embedded) setRunning();
  else startStage(null);
});

// debug handle for scripted checks in a desktop browser
(window as unknown as { __leadmate: unknown }).__leadmate = { game, scene, startStage, perf };

// dev readout: ?perf=1 shows loop wakeups/s, frames/s, simulation steps/s and ms per frame
if (new URLSearchParams(location.search).has('perf')) {
  const box = document.createElement('pre');
  box.style.cssText = 'position:fixed;top:0;left:0;margin:0;padding:2px 6px;font:11px monospace;color:#0f0;background:#000a;pointer-events:none;z-index:9';
  document.body.appendChild(box);
  let last = { t: performance.now(), wakes: 0, frames: 0, steps: 0 };
  setInterval(() => {
    const now = performance.now();
    const { wakes, frames } = perf;
    const steps = perf.steps();
    const dt = (now - last.t) / 1000;
    const fps = (frames - last.frames) / dt;
    box.textContent = `wakes/s ${((wakes - last.wakes) / dt).toFixed(1)}  frames/s ${fps.toFixed(1)}  steps/s ${((steps - last.steps) / dt).toFixed(1)}  ms/frame ${fps > 0 ? (1000 / fps).toFixed(1) : '-'}`;
    last = { t: now, wakes, frames, steps };
  }, 1000);
}
