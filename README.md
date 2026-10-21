# LeadMate

A "flight simulator" for dog owners: short simulated walks build leash-handling reflexes and timing.
Terms (Handler, Dog, Stage, Tension Ratio, Poste, Marker…) follow [`GLOSSARY.md`](GLOSSARY.md).

`base-leadmate` is the first playable slice: one Stage, a walk to a final waypoint where a skateboarder
Distractor makes the Dog fixate, and a Marker to press when the Dog disengages. `training-loop-and-learning`
adds the Node loop (Theory Primer, Checkpoint, Interactive Simulation, Debrief), a Dog that learns and
persists, Arousal-driven Fixation, Equipment, the Cue and Voice Packs. `engagement-and-worlds` adds the
four Worlds, solid Boundaries with corner leash wraps and Visual Shields, the Reaction Tiers (Calm, Alert,
Reactive) with dog vocalizations, Sintonía, Go Sniff, the second Cue ("Leave It"), the Walk Diary with the
daily Streak and "El Paseo del Día" (Daily Stage).

## Layout

| Path | What |
| --- | --- |
| `App.tsx`, `src/shell/` | Expo (React Native + NativeWind) shell: loads the simulation, shows results and the Resume overlay |
| `bundle/` | Phaser 3 bundle (Vite, single file): scene, HUD, input. Runs in a browser tab and in the shell's WebView |
| `src/sim/` | Pure, seeded, fixed-step simulation logic (no Phaser, no `Math.random`, no storage) — see [ADR 0002](docs/adr/0002-pure-seeded-simulation.md). `learning.ts` holds the read-only snapshot a Stage receives ([ADR 0003](docs/adr/0003-learning-state-snapshot-in-update-out.md)) |
| `src/shell/` (logic) | Pure shell logic, tested without React Native: `learning.ts` (`updateLearning`, Trigger Profile lowering, posture), `dogRecord.ts` (the versioned local Dog record), `rusty.ts` (Rusty Dog), `voice.ts` (Voice Packs, Cue resolution), `nodes/` (Node data, state machine, Poste practice Minigame, initial content) |
| `src/shell/` (engagement) | `world.ts` (`WorldDef`, sequential unlocking), `streak.ts` (daily Streak, Walk Diary entries), `daily.ts` (date seed, Daily Stage generator and lifecycle), `vocalize.ts` (dog sounds with a 2 s repeat cooldown), `nodes/scenarios.ts` (the Stages of Worlds 1-4 as data), `nodes/doorbellMat.ts` (World 1 timing Minigame) |
| `src/shell/screens/` | Home (Streak flame, Daily card, World map), Node steps, Debrief with the Walk Diary, Minigames, Daily result and settings screens |
| `src/sim/` (engagement) | `geometry.ts` (walls, sliding, line of sight, corner leash path), `scenery.ts` (scenery sets and the density validator) |
| `src/hud/` | Pure HUD logic: isometric projection, joystick detents, keyboard mapping, text fitting, Cue/Go Sniff button layout, Dog pose |
| `src/i18n/` | Text catalog and lookup |
| `docs/adr/` | Decisions: [Phaser in a WebView](docs/adr/0001-phaser-in-webview.md), [pure seeded simulation](docs/adr/0002-pure-seeded-simulation.md), [learning snapshot in, update out](docs/adr/0003-learning-state-snapshot-in-update-out.md), [Arousal causes Fixation](docs/adr/0004-arousal-causes-fixation.md), [Stars merge by max](docs/adr/0007-stars-merge-by-max.md) |

## Running

```bash
npm install

# 1. the simulation bundle (port 5173) — open http://localhost:5173 to play it on its own
npm run sim:dev

# 2. the app shell
npm run web          # desktop browser (the bundle runs in an iframe)
npx expo start       # then scan the QR code with Expo Go on Android / iPhone
```

On a phone the shell loads the simulation embedded in the app (built by `npm run sim:embed`, which
`npm start` runs first), so no second server or tunnel is needed and Expo `--tunnel` works. After
changing code under `bundle/` or `src/sim/`, run `npm run sim:embed` and reload the app. To load a live
dev server instead, set `EXPO_PUBLIC_SIM_URL` (for example `http://<LAN IP>:5173`).

```bash
npm test             # Jest: simulation, HUD logic, catalog
npm run typecheck    # shell and bundle
npm run sim:build    # single-file bundle in bundle/dist/index.html
```

### Controls

- **Touch:** left thumb = analog joystick (dead zone = stand still / Poste; soft detents at walk and quick),
  right thumb = Marker button, with the Cue button(s) just above it ("Leave It" beside "Let's Go" in World 3+),
  and the contextual Go Sniff button beside the Marker while it is on offer.
- **Desktop (debug):** `W`/`A`/`S`/`D` move at walk strength (`W` is forward along the route, up-right on
  screen), `2` replaces `W` for quick forward movement, `Space` or `M` is the Marker, `C` is "Let's Go", `L` is
  "Leave It" and `N` is Go Sniff.

The thin bar at the bottom of the Stage is the Dog's Arousal (no text; green, then yellow, then red).

### Scripted browser checks

`scripts/` has headless-Chrome scripts used to verify behavior (they need `npm run sim:dev`, and
`npm run web` for the shell one): `play.mjs` (keyboard play-through), `touch.mjs` (phone-sized touch
emulation, including the Cue button and the portrait layout), `shell.mjs` (the web shell end to end: Poste
practice, a walking Node with a Cue, pause/Resume, Debrief, settings, Rusty Dog), `worlds.mjs` (the World
scenarios in the standalone page: walls and scenery, Reaction Tiers, Sintonía, Go Sniff, both Cues, the Daily
Stage) and `playtest.mjs` (the engagement features end to end in the web shell: World unlocking, both World 1
Minigames, Walk Diary and Streak, Daily Stage and its replay; takes a viewport size, so it also runs phone-sized).
`power.mjs` is the power regression check: at most 30 frames/s while playing, and zero frames drawn while the
Stage is paused, ended, suspended by the shell (`suspend`/`wake`) or hidden (run `node scripts/power.mjs`; it also
prints the old unlimited-loop numbers as a baseline). Open the standalone page with `?perf=1` for a live readout of
frames/s, simulation steps/s and ms per frame.
`gen-dog-sounds.mjs` regenerates the placeholder dog vocalizations in `assets/dog/`.

## Simulation → shell contract

The shell sends `ShellMessage`s and receives `BundleMessage`s (`src/sim/messages.ts`) as JSON over
`postMessage` (WebView bridge on native, `window.postMessage` between iframe and page on web). The
payload has the same shape in both.

```ts
// shell → bundle
{ type: 'start', seed?: number, catalog?: Catalog, scenario?: Partial<ScenarioConfig> }
{ type: 'pause' } | { type: 'resume' } | { type: 'suspend' } | { type: 'wake' }

// bundle → shell
{ type: 'ready' } | { type: 'paused' } | { type: 'error', message: string }
{ type: 'debrief', payload: SimulationDebriefPayload }
{ type: 'playCue', cueType?: 'lets-go' | 'leave-it' } // a Cue took effect; the shell picks the file and plays it (fire and forget)
{ type: 'reaction-tier-change', tier: 'calm' | 'alert' | 'reactive', time: number } // the shell plays a whine/growl or a bark
```

```ts
interface SimulationDebriefPayload {
  durationSeconds: number;
  slackPercentage: number;   // share of Stage time Slack / Taut / Rigid Pull; the three sum to 100
  tautPercentage: number;
  pullPercentage: number;
  markerAccuracyMs?: number; // Marker press minus Disengagement, ms; absent when there was no hit
  markerHits: number;
  markerMisses: number;
  reactiveMarkers: number;   // presses while the Dog was fixated or in Rigid Pull
  missedOpportunities: number; // the Distractor left before the Dog disengaged
  checkInHits: number;       // presses while the Dog was looking at the Handler (glance or after a turn)
  followMarks: number;       // Check-in hits on a look after the Dog followed a turn
  posteSuccesses: number;    // stops at the leash limit during which a Fixation ended in a Disengagement
  harshStops: number;        // abrupt stops at the leash limit with the Dog moving outward
  peakArousalScore: number;  // highest Arousal the Dog reached, 0-100, unscaled
  calmEncounters: Partial<Record<DistractorKind, number>>; // Disengagement + Marker hit, per Distractor kind
  marksUsed: number;         // every Marker press spends one Mark, hit or not
  markBudget: number;        // Marks available in the Stage (default 5)
  seed: number;              // same seed + same inputs → same Stage and payload
  sintoniaTimeSeconds: number; // seconds of active Sintonía
  goSniffs: number;          // Go Sniffs the Handler started
  handlingScore: number;     // 0-1000 composite, see below
}
```

`runScripted(seed, inputs)` in `src/sim/harness.ts` plays a Stage without rendering, which is how
the tests replay a seed. The same seed, inputs **and `scenario.learning` snapshot** give the same payload.

### Learning snapshot (`scenario.learning`)

```ts
interface LearningSnapshot {
  attributes: { reconnectionLatency; reactivityThreshold; followChance; checkInFrequency }; // progress 0-1
  triggerProfile: Record<'child' | 'bicycle' | 'dog' | 'skateboard' | 'food' | 'other', 0 | 1 | 2 | 3>;
  equipment: 'collar' | 'harness';
  capacityMultiplier: number; // session only (Rusty Dog skipped = 0.8)
  posture: 0 | 1 | 2;         // visual only
}
```

The shell builds it from the Dog record (`toSnapshot`), runs the Stage, and applies the payload with the pure
`updateLearning` / `updateTriggerProfile` (`src/shell/learning.ts`). `ranges` in `src/sim/config.ts` says how
progress becomes seconds, Arousal and intervals. Arousal (0-100, starts at 0 every Stage) rises by
`k * (v / d) * TriggerFactor` per second near a Distractor and during Rigid Pull, and Fixation starts when it
reaches the Dog's reactivity threshold ([ADR 0004](docs/adr/0004-arousal-causes-fixation.md)).

### Engagement and Worlds

- **Reaction Tiers** come from Arousal against the reactivity threshold `T`: Calm below `0.6 T`, Alert up to `T`,
  Reactive from `T`. An Alert Dog slows a little; a Reactive Dog barks and lunges (`+1.5 m/s²` toward the
  Distractor) and braces against the leash so Rigid Pull stays; a Marker pressed then is a `marker-reactive`,
  with no credit (the Reward Window after a Disengagement still counts). Every change is a
  `reaction-tier-change` event, forwarded over the bridge.
- **Sintonía** starts after 2 s with the leash Slack, the Handler faster than 0.4 m/s and turning at 0.2-1.8 rad/s
  (summed over the last 0.5 s), and ends at once on Taut, a stop or a reversal over 90°. It is feedback and
  telemetry only: it never changes the physics.
- **Go Sniff** is offered for 3 s once a Disengagement's Reward Window is over (World 2+, leash Slack): 4 s at
  0.4 m/s with Arousal decaying 3× faster, ended early by Taut or Arousal 0.
- **Cues:** `scenario.cues` lists the buttons on the HUD. "Leave It" works on food (`salience`, stationary) and
  lets the Dog go at once; "Let's Go" on everything that moves. The other one is ineffective (`cue-mismatch`).
- **Geometry:** `scenario.waypoints` (corridor points before `waypoint`), `walls` (block movement along their
  normal, break line of sight, leash wraps around their corners) and `scenery` (props; a `visualShield` prop such
  as a parked car breaks line of sight too). `moreDistractors` is a schedule, with `spawnAtSeconds` for timed spawns.
  `validateScenario` (`src/sim/scenery.ts`) checks the geometry, that props match the theme and the density
  rule: one prop per 5 m of route, at least 8.
- **Handling score** (`handlingScore` in `payload.ts`, [ADR 0005](docs/adr/0005-daily-stage-leaderboard-scoring.md)):
  Composure `(100 - peak Arousal) / 100 × 400`, Slack share `× 300`, Marker accuracy `× 200` (full at 0 ms, none at
  1100 ms; full when there was no encounter), Sintonía `× 100` (full at 40% of the Stage).
- **Daily Stage** (`src/shell/daily.ts`): `generateDailyStage('YYYY-MM-DD')` builds the same corridor, walls and
  Distractor schedule for a local date, and the same date also fixes the simulation seed. Finishing it keeps the
  best score of the day, credits the Streak on the first clear and clears the Rusty Dog for the session; it
  never touches Learning Attributes, the Trigger Profile, posture, completed Nodes or the last-Stage date.
- **Streak** (`src/shell/streak.ts`): consecutive local days with a Node Debrief, a Walk Diary answer or a Daily
  Stage; a missed day starts again at 1 and never changes the Dog.
- **Worlds** (`src/shell/world.ts`): World N+1 opens when every Node of World N is in `completedNodes`.

### Voice Packs and audio

`src/shell/voice.ts` lists the Voice Packs, each with one Cue per supported language (`SUPPORTED_LANGUAGES`).
`resolveCue` picks the user's own recording for the active language, else the pack's Cue. The files in
`assets/voice/` are **placeholder tones**; the dog sounds in `assets/dog/` are synthesized placeholders too
(`node scripts/gen-dog-sounds.mjs`). Replace the Cue files with spoken recordings under the same names
(`lets-go.es.wav`, `aqui.es.wav`) and add a file per language when a language is added. Custom Cues are recorded
in settings (2 s, microphone permission) and stay on the device.

All tunables (leash length, speeds, trigger radius, calm period, Reward Window…) are in
`src/sim/config.ts`.

## Accounts and sync (Supabase)

The app is local-first: the Dog record in local storage is the source of truth, and the account only replicates it ([ADR 0006](docs/adr/0006-local-first-sync.md)). With no backend configured the app and `npm test` run unchanged.

Setup of a backend:

1. Create a Supabase project.
2. Apply the schema in `supabase/migrations/` (`supabase link --project-ref <ref>` then `supabase db push`). It creates `dogs` and `level_configs` with row-level security.
3. Deploy the account-deletion function: `supabase functions deploy delete-account`.
4. In Authentication, keep email confirmations on. Unverified accounts sync for 7 days, then pause until verified.
5. Copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Project settings, API). Restart Expo so the values are inlined.
6. Optional remote level configs: insert rows into `level_configs` with `published = true`. The app validates each one and falls back to the bundled config when it is invalid; Daily Stages never use them.

Row-level security checks run with `supabase test db` (needs Docker); `src/shell/sync/schema.test.ts` also checks the migration text in the normal test run.

Rollback: unset the two environment variables and rebuild. The app goes back to local-only with no data lost. Signed-in users keep their local Dog; the cloud rows stay until the account is deleted in the app.

## Adding a language

1. Copy `src/i18n/es.ts` to `src/i18n/<code>.ts` and translate the values (keys stay the same;
   the type is `Catalog`, so you may translate a subset — missing keys fall back to Spanish).
2. In `App.tsx`, set `CATALOG` to the new catalog. The shell owns the active language and sends the
   catalog to the bundle in the `start` message.
3. Check the HUD with strings about 40% longer than the Spanish ones: layout helpers in
   `src/hud/layout.ts` shrink text to fit, and `npm test` fails if user-visible text appears in code
   outside the catalog.

Never put text in images; the Marker button is an icon.

## Adding a Node

A Node is plain data (`NodeDef` in `src/shell/nodes/node.ts`): mode (`stage` or `minigame`), 3 to 5 Primer
cards, a Checkpoint question, the simulation config, exercises (one per metric: `tension`, `timing`, `poste`,
`attention`) and prerequisites. Add it to `NODES` in `src/shell/nodes/content.ts` with its text in the
catalog (`node.<slug>.title`, `card1`-`card4`, `question`, `optionRight`, `optionWrong1`, `optionWrong2`,
`exercise1`...), then list its id in a World in `src/shell/world.ts`. Its Stage is a scenario in
`src/shell/nodes/scenarios.ts`; `npm test` validates every one of them (geometry, theme, density) and walks it
to the end. The Debrief shows the exercise for the user's weakest metric and the one-tap Walk Diary. A Poste
scenario lists `poste-practice` as a prerequisite.

## UI kit and feedback

Every shell screen draws from one token file, `src/shell/ui/tokens.json` (colour, radius, depth, spacing, type),
read by `theme.ts`, by `tailwind.config.js` and, through `scripts/gen-hud-tokens.mjs`, by the Phaser HUD
(`bundle/src/tokens.generated.ts`, regenerated by `npm run sim:build` and `sim:embed`). Use the components in
`src/shell/ui/components.tsx` (`GameButton`, `Panel`, `ProgressBar`, `Badge`, `Chip`, `StarRow`, `Choice`) and
the tokens; a test fails on a raw colour or font in a screen. Text keeps 4.5:1 contrast and every control a
44-point touch target; labels wrap and are never truncated.

Feedback (haptic and short UI sound) goes only through `src/shell/ui/feedback.ts` (`press`, `success`, `star`,
`unlock`). It is fire-and-forget, swallows every error, skips sounds while a Cue or Dog sound plays, and never
touches the simulation. Sounds and haptics are device-local settings (Settings screen, on by default). Motion
reads `useMotion()`, which follows the OS reduced-motion setting: under it everything is a fade or static, with
the same information. Rewards come from handling quality only (Stars, [ADR 0007](docs/adr/0007-stars-merge-by-max.md));
there are no hearts, no lost Stars and no lost-Streak messages.

`node scripts/gamefeel.mjs [url] [outDir] [width] [height]` walks the map, a Node, the Daily and Settings on web
with sounds and haptics off and reduced motion on, and checks for clipping (needs `npm run sim:dev` and `npm run web`).

## Credits

The UI sounds in `assets/ui/` are synthesized by `scripts/gen-ui-sounds.mjs` and need no credit. The display
font is **Lilita One** (SIL Open Font License 1.1, via `@expo-google-fonts/lilita-one`).

Art is by Kenney (<https://www.kenney.nl>), CC0: free to use in personal and commercial projects, credit
appreciated. The ground and road tiles are from **Isometric Roads**. The props come from the **Nature Kit**,
**Furniture Kit**, **Car Kit** and **City Kit (Roads, Suburban)**, and the Handler, the Dog and the Distractors from
**Mini Characters** and **Cube Pets**. The 3D models are rendered to isometric sprites with `scripts/kenney/`
(`render-sprites.mjs`, then `pack-sprites.py`) into one atlas, `bundle/assets/kenney/sprites.{png,json}`.
The license text ships at `bundle/assets/kenney/LICENSE.txt`.

## Playtest log (task 7.1)

Have yourself and 3–5 dog owners play the Stage unassisted on desktop, Android and iPhone. Record per
player whether they understood the Poste and the Marker without being told, whether they wanted to
play again, and which orientation (portrait or landscape) they preferred.

| Player | Device | Understood Poste unaided | Understood Marker unaided | Wanted to play again | Preferred orientation |
| --- | --- | --- | --- | --- | --- |
| _not yet played_ | | | | | |
