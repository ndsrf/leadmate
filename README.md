# LeadMate

A "flight simulator" for dog owners: short simulated walks build leash-handling reflexes and timing.
Terms (Handler, Dog, Stage, Tension Ratio, Poste, Marker…) follow [`GLOSSARY.md`](GLOSSARY.md).

This is the first playable slice (`base-leadmate`): one Stage, a walk to a final waypoint where a
skateboarder Distractor makes the Dog fixate, and a Marker to press when the Dog disengages.

## Layout

| Path | What |
| --- | --- |
| `App.tsx`, `src/shell/` | Expo (React Native + NativeWind) shell: loads the simulation, shows results and the Resume overlay |
| `bundle/` | Phaser 3 bundle (Vite, single file): scene, HUD, input. Runs in a browser tab and in the shell's WebView |
| `src/sim/` | Pure, seeded, fixed-step simulation logic (no Phaser, no `Math.random`) — see [ADR 0002](docs/adr/0002-pure-seeded-simulation.md) |
| `src/hud/` | Pure HUD logic: isometric projection, joystick detents, keyboard mapping, text fitting |
| `src/i18n/` | Text catalog and lookup |
| `docs/adr/` | Decisions: [Phaser in a WebView](docs/adr/0001-phaser-in-webview.md), [pure seeded simulation](docs/adr/0002-pure-seeded-simulation.md) |

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
  right thumb = Marker button.
- **Desktop (debug):** `W`/`A`/`S`/`D` move at walk strength (`W` is forward along the route, up-right on
  screen), `2` replaces `W` for quick forward movement, `Space` or `M` is the Marker.

### Scripted browser checks

`scripts/` has headless-Chrome scripts used to verify behavior (they need `npm run sim:dev`, and
`npm run web` for the shell one): `play.mjs` (keyboard play-through), `touch.mjs` (phone-sized touch
emulation), `shell.mjs` (pause/Resume, results, Play again in the web shell).

## Simulation → shell contract

The shell sends `ShellMessage`s and receives `BundleMessage`s (`src/sim/messages.ts`) as JSON over
`postMessage` (WebView bridge on native, `window.postMessage` between iframe and page on web). The
payload has the same shape in both.

```ts
// shell → bundle
{ type: 'start', seed?: number, catalog?: Catalog, scenario?: Partial<ScenarioConfig> }
{ type: 'pause' } | { type: 'resume' }

// bundle → shell
{ type: 'ready' } | { type: 'paused' } | { type: 'error', message: string }
{ type: 'debrief', payload: SimulationDebriefPayload }
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
  marksUsed: number;         // every Marker press spends one Mark, hit or not
  markBudget: number;        // Marks available in the Stage (default 5)
  seed: number;              // same seed + same inputs → same Stage and payload
}
```

`runScripted(seed, inputs)` in `src/sim/harness.ts` plays a Stage without rendering, which is how
the tests replay a seed.

All tunables (leash length, speeds, trigger radius, calm period, Reward Window…) are in
`src/sim/config.ts`.

## Adding a language

1. Copy `src/i18n/es.ts` to `src/i18n/<code>.ts` and translate the values (keys stay the same;
   the type is `Catalog`, so you may translate a subset — missing keys fall back to Spanish).
2. In `App.tsx`, set `CATALOG` to the new catalog. The shell owns the active language and sends the
   catalog to the bundle in the `start` message.
3. Check the HUD with strings about 40% longer than the Spanish ones: layout helpers in
   `src/hud/layout.ts` shrink text to fit, and `npm test` fails if user-visible text appears in code
   outside the catalog.

Never put text in images; the Marker button is an icon.

## Credits

Scenery tiles and trees are from Kenney's **Isometric Roads** pack (<https://www.kenney.nl>),
free to use in personal and commercial projects, credit appreciated. The license text ships at
`bundle/assets/kenney/LICENSE.txt`. Handler, Dog and Distractor are placeholder shapes.

## Playtest log (task 7.1)

Have yourself and 3–5 dog owners play the Stage unassisted on desktop, Android and iPhone. Record per
player whether they understood the Poste and the Marker without being told, whether they wanted to
play again, and which orientation (portrait or landscape) they preferred.

| Player | Device | Understood Poste unaided | Understood Marker unaided | Wanted to play again | Preferred orientation |
| --- | --- | --- | --- | --- | --- |
| _not yet played_ | | | | | |
