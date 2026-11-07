import type { EndlessKind } from './endlessAnimations';

/**
 * Every endless animation or repeating timer allowed in the app, with the reason it stays. A new one fails
 * `endlessAnimations.test.ts` until it is listed here with a count and a reason. Each must be gated by screen
 * focus, app state and need (see the `power-efficiency` spec), not just run forever.
 */
export interface AllowedEndless {
  file: string;
  kind: EndlessKind;
  count: number;
  reason: string;
}

export const ENDLESS_ALLOWLIST: AllowedEndless[] = [
  { file: 'src/shell/ui/ticker.ts', kind: 'setInterval', count: 1, reason: 'the one shared repeating timer, started only through useTicker while its screen is running and the app is in front; users: Diagnostic, Read-the-Dog and Poste minigame clocks and Node countdown (end with the minigame), reveal (ends when done), Barkdoku puzzle clock (a visible running clock; one tick per 250 ms, re-renders only when the second changes, stops when the puzzle is not running)' },
  { file: 'bundle/main.ts', kind: 'setInterval', count: 1, reason: 'dev-only `?perf=1` readout, created only when the page address asks for it' },
  { file: 'src/shell/screens/SplashScreen.tsx', kind: 'withRepeat', count: 1, reason: 'loader line while the app loads; gated by useMotionGate (app active, screen in front, reduced motion)' },
  { file: 'src/shell/ui/MinigameProps.tsx', kind: 'withRepeat', count: 1, reason: 'bell ripple only while the bell rings; gated by useMotionGate (app active, screen in front, reduced motion)' },
  { file: 'src/shell/ui/ContentUpdateBanner.tsx', kind: 'Animated.loop', count: 1, reason: 'Migas wiggle in the content-update banner; the banner exists only while a Content Pack downloads, and the loop is gated by useMotionGate (app active, screen in front, reduced motion)' },
  { file: 'src/shell/ui/CanineMinigameAvatar.tsx', kind: 'withRepeat', count: 1, reason: 'posture wobble; gated by useMotionGate (app active, screen in front, reduced motion) and only for the postures that move' },
  { file: 'bundle/src/handDrillView.ts', kind: 'css-infinite', count: 1, reason: 'hand drill button pulse (a composited transform); paused by the #hd root class while the drill is not playing. The nudge and bob run in the 30 Hz render path' },
];
