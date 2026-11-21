# Design

## Context

- `content/beta/worlds/cafe.yaml` is a Preview World: `worldNumber: 7`, `tier: plus`, `unlockedBy: recall`, `preview: true`, `nodeCount: 4`, `stretches: []`. Its title, topics and preview text already exist in `src/i18n/{es,en}.ts` (`world.cafe.*`), and the map already has a cafe preview scenery (`WorldSceneryBackground.tsx`, `previewSceneryOf('cafe')`).
- **Close view**: the close exercise always draws its distractor as a dog (`distractor_close_*` in `bundle/src/CloseExerciseScene.ts`).
- **Walking Stage**: it draws `other` as a jogger (`bundle/src/StageScene.ts`).
- **Scenery**: no scenery theme has café props (`THEME_PROPS` in `src/sim/scenery.ts`).
- **Minigame engine**: the choose-the-action engine in `src/shell/nodes/readDog.ts` covers nine scenes and is mostly data: a scene's actions (`SCENE_ACTIONS`), its correct action per state (`CORRECT_ACTION`), its beats (`READ_DOG.beats`), a seeded script (`buildScript`), hints (`hintKey`) and a backdrop chosen in `ReadDogView.tsx`. Each state is a posture in `src/shell/ui/canine.ts`, with a caption and a cue.
- **Minigame kinds**: they are a closed list in `SUPPORTED_MINIGAMES` (`src/shell/content/schema.ts`) and `MinigameKind` (`src/shell/nodes/node.ts`). A pack that names an unknown kind fails validation, so older apps reject it.
- **Lesson art**: built from `scripts/art/lessons/_kit/kit.mjs`, which generates `kit.svg`, and rendered by `scripts/render-lesson-art.mjs` with palette and no-words checks. Node media lives under `scripts/art/nodes/<node-id>/`.
- **Art source**: the canvas artboards "Mundo 7 — Kit de terraza" and "Mundo 7 — Escenas de terraza" hold the approved designs, already composed as kit SVGs, with 20 scenes that pass the kit checks.

## Goals / Non-Goals

**Goals:**
- Make World 7 playable with real, useful terrace guidance, reusing the walking Stage and the close exercise unchanged.
- Add a Terrace scene to the existing choose-the-action engine. The engine stays the same; only the scene's data and backdrop are new.
- Ship the art through the existing kit pipeline, not as raster exports.

**Non-Goals:**
- A waiter sprite or a café theme in the Phaser walking and close views.
- A new Minigame engine, timers that differ from other scenes, or a "leave" action in the Minigame. Leaving in time is taught by its Lesson, its Checkpoint and its Mission.
- Any change to World 8 or 9 beyond their Coming-soon wording.

## Decisions

### Node per Stretch

| Stretch | Node id | Mode | Why this mode |
|---|---|---|---|
| Preparar la visita | `cafe-arrive` | `stage`, `urban_street` | Arriving calm is a walking skill. The route ends at a kiosk and benches standing in for the terrace, with `food` distractors on the route, so Leave-it (introduced in World 4) applies. |
| Relajación en mesa | `cafe-settle` | `minigame: cafe-settle` | Settling is about reading states and choosing when to reward, which is what the choose-the-action engine trains. |
| Paso de camareros | `cafe-passing-dog` | `close_exercise`, `leash_drill`, distractor `dog` | Gathering the leash, shielding and marking are the close exercise's controls. The sim draws a dog, so the Node is framed honestly as "another dog passes your table". Waiters are covered by the Lesson, the Image Duel and the Mission. |
| Irse a tiempo | none | n/a | No existing mechanic models overload over time. A thin Node would add play time without teaching. The Mission `trains` points to `cafe-settle`. |

*Alternatives:* a stage with `other` as a "waiter" was rejected because it would draw a jogger. A second Terrace scene for overload was rejected because it is scope the user did not ask for.

### Terrace scene in the engine

- **Kind and scene**: Minigame kind `cafe-settle`, scene `cafe`, 5 beats.
- **Buttons**, in layout order: `ignore`, `wait`, `marker`, `feed` (a new `ReadDogAction`, labelled "Dar de la mesa" / "Feed from the table").
- **New `DogState`s**: `begging_table` → `ignore`, `staring_waiter` → `wait`. Existing states reused: `sitting_attentive` (looks back at you) → `marker`, `relaxed_lying` → `marker`.
- **Script**: `pair(begging_table, staring_waiter)`, then `sitting_attentive`, then a seeded `begging_table` or `staring_waiter`, then `relaxed_lying`, salted like the other scenes.
- **Hints**:
  - The terrace is not a living-room scene, so it gets its own keys, `minigame.cafe.hint.<action>`, per right action, the way living-room scenes do.
  - `feed` always shows `minigame.cafe.hint.feed`, mirroring the Cuddle rule in `hintKey`.
  - On a relaxed beat, `feed` shows `minigame.cafe.hint.feedCalm`.
- **Postures**: two new postures in `canine.ts`.
  - `begging_table` is based on `begging_lift`, aimed at the table.
  - `staring_waiter` is based on `staring_door`, with its own caption and cue key.
  - This keeps the art risk low while meeting "states look different" against `sitting_attentive`.
- **Backdrop**: a `TerraceScene` in `MinigameProps.tsx`, drawn in RN vector like `LivingRoomScene`.
  - Café front, table with cup, chair with the seated Handler, mat.
  - A waiter crossing during `staring_waiter` beats.
  - A treat dropping on a correct Marker.
  - Its shapes follow the canvas "Kit de terraza" board and use only `tokens.json` colours, so the no-raw-colours test passes.
- **Required Lessons**: `requiredLessonsOf` stays as is. The Node opens after `theory-cafe-settle` (the Stretch order already does that), and World 1 already taught the mechanic in `howto-choose-action`.

*Alternatives:* a new engine was rejected because it duplicates code. Reusing `rest` with a terrace skin was rejected: its actions (send-away, go-outside) are wrong at a café.

### Content ids

- **Lessons**: `theory-cafe-setup`, `theory-cafe-settle`, `theory-cafe-waiters`, `theory-cafe-leave-early`.
- **Nodes**: `cafe-arrive`, `cafe-settle`, `cafe-passing-dog`.
- **Missions**:
  - `mission-cafe-short-visit` (trains `cafe-arrive`)
  - `mission-cafe-settle` (trains `cafe-settle`)
  - `mission-cafe-waiters` (trains `cafe-passing-dog`)
  - `mission-cafe-leave-early` (trains `cafe-settle`)
- **Image Duels**:
  - `cafe-arrive`: `duel-wall.png` (correct) vs `duel-aisle.png`
  - `cafe-settle`: `duel-calm.png` (correct) vs `duel-asking.png`
  - `cafe-passing-dog`: `duel-short.png` (correct) vs `duel-long.png`

### Art pipeline

- Port the canvas symbols into `kit.mjs` as generated symbols (not hand-edited `kit.svg`).
- Copy the 14 Lesson scenes to `scripts/art/lessons/` and the 6 Duel scenes to `scripts/art/nodes/<node-id>/`.
- Run `render-lesson-art.mjs` to produce the PNGs and registries.

The scenes already use `<use href="#…">` with the new symbol ids, so they port without being redrawn. Two known nits get fixed while porting: in `cafe-leave-1` the whining lines read like a wifi icon, and in `cafe-waiters-do` the Dog's tail is clipped at the left edge.

### Versioning

- Bump the app to 1.4.0 and set `pack.yaml` `minAppVersion: 1.4.0` in beta, and in stable when promoted. Bump `contentVersion`.
- An app at 1.3.x rejects the pack, because it does not know `cafe-settle`, and keeps its bundled baseline, where World 7 is a Preview.

*Alternative:* ship the content first without the Minigame Node. This was rejected because Stretch 2 would lack its Node and the user chose the Minigame.

## Risks / Trade-offs

- **The "Paso de camareros" Node shows a dog, not a waiter.** → The Node's title, primer and Checkpoint name a passing dog. The waiter is taught where it can be drawn (Lesson art, Duel, Minigame beat), and a follow-up can add a waiter sprite.
- **`cafe-arrive` scenery is a city street, not a terrace.** → Frame it as arriving at the terrace. Place benches and a kiosk near the route end, and meet the density check like other urban scenarios.
- **Users on 1.3.x never see World 7 until they update.** → This is acceptable: the baseline still shows "Próximamente", which is today's state.
- **Total Lesson PNG weight against the 7 MB `BUDGET`.** → 20 more pictures, at about 80 kB each, may push it over. Check after rendering, and raise the budget with a comment, as World 6 did, only if it is needed.
- **The read-dog engine has an exhaustive `Record<ReadDogScene, …>` in several places** (beats, salt, help keys, actions). → TypeScript flags every missing entry, so the compiler lists the places to touch.

## Migration Plan

1. Land the code (engine scene, postures, backdrop, schema kind, i18n) with tests, and bump the app version to 1.4.0.
2. Author the content in `content/beta/`, validate, and render the art.
3. Promote to stable, regenerate the baseline (`release:prepare`), then run an EAS build and release.
4. **Rollback**: if the build is held back, the stable pack stays at `minAppVersion` 1.3.0 without World 7. Do not promote until the 1.4.0 build is in review.
