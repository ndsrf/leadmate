# Design

## Context

See `proposal.md` for motivation. Current state: the shell is React Native + NativeWind with Tailwind classes written inline on every screen (`slate-800` cards, a two-tone `Button` in `src/shell/Overlays.tsx`, `Screen.tsx` as a plain scroll column). The Stage runs in Phaser inside a WebView ([ADR 0001](file:///home/jgm/dev/projects/web-projects/leadmate/docs/adr/0001-phaser-in-webview.md)) with its own CSS strings in `bundle/src/overlay.ts` and HUD code in `src/hud/`. The sim is pure and seeded ([ADR 0002](file:///home/jgm/dev/projects/web-projects/leadmate/docs/adr/0002-pure-seeded-simulation.md)). `react-native-reanimated` is installed but unused for UI; there is no haptics package. The `DogRecord` is versioned, validated on read (`dogRecord.ts`) and synced by last-write rules ([ADR 0006](file:///home/jgm/dev/projects/web-projects/leadmate/docs/adr/0006-local-first-sync.md)). The shell targets native and web (`SimView.web.tsx`).

## Goals / Non-Goals

**Goals:**
- One token source and one component kit, so restyling is a one-file change and screens stop drifting.
- Make the World Map, results and press interactions feel like a game, with the work concentrated where users spend time: World Map, Node result, Daily result, Stage HUD.
- Work on native and web, degrade silently where haptics or audio are missing.

**Non-Goals:**
- Redrawing Stage art or Dog sprites, new gameplay, a currency, shop or cosmetics.
- Changing score weights ([ADR 0005](file:///home/jgm/dev/projects/web-projects/leadmate/docs/adr/0005-daily-stage-leaderboard-scoring.md)) or anything the sim emits.
- Theming per World in this change (tokens leave room for it).

## Decisions

1. **Tokens in one TypeScript module, mirrored into Tailwind.** `src/shell/ui/theme.ts` exports the palette, type scale, radii, depth and spacing; `tailwind.config.js` imports it into `theme.extend` so classes (`bg-brand`, `text-ink`) and runtime style objects (reanimated, the Flame, the Phaser HUD) read the same values. *Alternative:* Tailwind-only tokens, rejected because the HUD and animated styles cannot read class names. *Alternative:* a theming library, rejected as overkill for one theme.
2. **A small component kit, then migrate screens.** `src/shell/ui/` holds `GameButton`, `Panel`, `ProgressBar`, `Badge`, `Chip`, `StarRow`, `Screen`. `Overlays.tsx` re-exports `Button`/`Backdrop`/`Row` backed by the kit, so existing call sites keep working and migrate screen by screen. Primary buttons get the raised look with a darker bottom edge that collapses on press (cheap, works on web, no gradient package needed). Pure style computation (variant → colours, pressed offsets) lives in plain functions so it is unit-testable without rendering.
3. **Typography: one bundled display font for titles and numbers, system font for body.** Loaded with `expo-font`; the app renders with the system font until it is ready and never blocks on it. *Alternative:* system fonts only; rejected because type is the cheapest large step toward a game look. Body text stays system for legibility and long translations.
4. **Phaser HUD gets tokens by build-time generation.** A small script emits the token subset as CSS variables / a TS constant for `bundle/` (like the existing `sim:embed`), so the bundle does not import RN code. `overlay.ts`'s standalone CSS and the HUD button styles read it.
5. **Feedback is a single service: `ui/feedback.ts`.** `press()`, `success()`, `star(n)`, `unlock()` each fire haptic + sound, check the settings and reduced-motion flags, and swallow all errors (same fire-and-forget rule as `audio.ts`). Haptics via `expo-haptics` (no-op on web). UI sounds are short bundled files played through a separate player from the Cue/Dog players and skipped while those are playing. Components call the service; nothing calls haptics directly. Alternative: per-component calls; rejected because settings and the "no overlap with Cue audio" rule would be duplicated.
6. **Motion with reanimated, one reduced-motion switch.** A `useMotion()` hook returns `reduced` from the OS (`AccessibilityInfo`/`prefers-reduced-motion`); animated components pick `withSpring`/loops or a fade/static state from it. Transitions are 150-300 ms and `pointerEvents` stay enabled throughout.
7. **World Map as a layout over existing data.** `world.ts` already provides `WORLDS`, `isNodeOpen` and `isWorldUnlocked`. A pure `mapModel(completed, stars)` function returns each Node's state (`locked | open | next | done`) and the next-up Node; the screen only draws it. The path is a vertical zig-zag of Node discs joined by line segments (View-drawn, no SVG dependency), a sticky header holds the chips, and the Dog marker is positioned at the next-up Node. The pure model carries the testing weight.
8. **Stars are derived, stored as best-of, and merge by max.** `starsFor(handlingScore | undefined)` is pure (1 at completion, 2 at ≥650, 3 at ≥850). `DogRecord.stars: Record<nodeId, 1|2|3>` is added with a record version bump and migration that defaults to `{}` (existing completed Nodes display 1 star). In sync merge, per-Node stars take the max of both sides, so a stale device cannot lower them, consistent with "never lowered". Stars never feed attributes or the Trigger Profile. Thresholds are constants beside `SCORE_WEIGHTS` so they can be tuned.
9. **Reveal is a state machine.** The result screen steps `score → stars → rows → done` on a timer driven by `useMotion`; any press jumps to `done`. Under reduced motion it starts at `done` with a fade. Celebrations are computed once from `{before, after}` of the record (new completion, newly unlocked World, streak credited, daily new best) so each fires at most once and is testable as a pure diff function `celebrationsFor(before, after, completion)`.
10. **Settings are device-local, not in the synced record.** Sound/haptics toggles live in shell storage (`storage.ts`) because they describe the device, not the Dog. Defaults: both on.
11. **Tone constraints are requirements, not copy.** No hearts, no star loss, no "you lost your streak" text; a lapsed Streak shows the existing neutral start state. This is enforced in the specs and covered by a catalog test that no new string key uses a banned loss-framing prefix (kept simple: key allowlist review in tasks).

## Risks / Trade-offs

- [Scope sprawl: "make it a game" has no end] → Limit to four capabilities and the four high-traffic screens; remaining screens get the kit via the `Overlays` re-exports and nothing more.
- [Animation hurts low-end Android or web perf] → Animate only transform/opacity, cap concurrent loops (one next-up pulse), measure on a low-end device in tasks.
- [Haptics/sounds annoy or disturb a Stage] → Separate toggles, no UI sounds over Cue/Dog audio, none during a Stage except the HUD's own sounds.
- [Stars distort learning, e.g. users replay for stars] → Stars come only from handling score; replay is already allowed and harmless, and nothing gated behind 3 stars.
- [Record version bump breaks sync with an older build] → Reader ignores unknown fields and defaults `stars` to `{}`; merge by max; covered by `dogRecord.test.ts` additions.
- [Spanish-first strings run long in chips] → Wrap/shrink rule in the theme spec, tested with a long-label fixture.
- [Font load shifts layout] → Pick metrics-compatible fallback sizes and reserve chip heights.

## Migration Plan

Ship behind no flag: the kit is a visual replacement. Order: tokens and kit → `Overlays` re-exports → World Map → results/celebrations → feedback service and settings → HUD tokens. Each step ships working. Rollback is reverting the commit; the only persisted addition is the optional `stars` field, which older builds ignore.

## Open Questions

- Final palette and display font choice (design review during the tokens task; the structure does not depend on it).
- Resolved: World-specific accent colours are a follow-up; per-breed Dog images are a follow-up (the Dog record has no breed field yet).
- Resolved: stars come from the handling score alone, with global thresholds; nothing is gated behind stars; reduced motion follows the OS only; celebrations are ephemeral (never queued or replayed).
