# Design

## Context

- The trail is plain data in `src/shell/world.ts` (`WORLDS`). Gating (`stopLock`, `isWorldUnlocked`, `isWorldComplete`) is generic over it. `currentWorld()` opens the map on the first incomplete playable World, so putting a World first makes it the start for new users without any extra code.
- `worldNumber` is used for more than labels. `WorldMapScreen.tsx` and `WorldSceneryBackground.tsx` choose palette (`theme.world.w1..w4`), backdrop and Top Landmark with `((worldNumber - 1) % 4) + 1`. Shifting numbers as-is would give Home the Sidewalk look.
- World titles are catalog strings with the number inside (`'world.1.title': 'Mundo 1 · Casa y umbrales'`).
- The "read the Dog, pick the action" engine (`nodes/readDog.ts`) is data-driven per scene: `ReadDogScene`, `SCENE_ACTIONS`, `CORRECT_ACTION`, `READ_DOG.beats` and `buildScript`. `ReadDogView.tsx` maps a scene to help text and has a doorbell-specific branch. Dog states are drawn by `ui/canine.ts` / `CanineMinigameAvatar.tsx`.
- `dogRecord.ts` already has versioned migration (`RECORD_VERSION = 7`, `migrateRecord`). Sync merges `readLessons` and `completedNodes` as unions, and merges Missions per id. Remote copies go through `migrateRecord` when read.
- Celebrations come from `celebrationsFor(before, after, completion)` when the user finishes something, never from loading a record.
- The how-to-play rule needs a how-to-play Lesson before the first Node that uses a new control. Tapping action buttons is currently taught in `howto-tap-hold`, before the Harness Ritual.

## Goals / Non-Goals

**Goals:**
- Add World 1 "Un perro es un perro" using only existing building blocks: Lessons, read-dog scenes and Missions.
- Make World identity, not World position, drive look and copy, so this renumbering, and any later one, only touches `worldNumber`.
- Mark the new World complete for existing users once, as plain record data, so gating code needs no special cases.

**Non-Goals:**
- No Lesson Animations or YouTube videos for the new Lessons in this change. The video slots stay empty until clips exist.
- No new simulator control or walking scene.
- No changes to the onboarding funnel, the guided first Stage, the Taste Stage or the Walk Plan card.
- No translations beyond Spanish. Other languages fall back to Spanish as today.

## Decisions

1. **World id `basics`, prepended to `WORLDS` with `worldNumber: 1`.** `home` gets `unlockedBy: 'basics'`, and every other World's `worldNumber` goes up by one. Preview Worlds become 6–9. *Alternative:* `worldNumber: 0`. The user rejected it: it reads like a prologue, not "the first world".

2. **Look and titles keyed by World id.**
   - Theme tokens become `theme.world.basics | home | sidewalk | urban | park`. The scenery and landmark dispatchers switch on `world.id`, and preview Worlds fall back to a cycle by id index.
   - Catalog title keys become `world.<id>.title` and `world.<id>.topics`. The visible title is composed from a `world.numbered` template (`'Mundo {n} · {name}'`) and `worldNumber`.
   - *Alternative:* shift every `world.N.*` key and `wN` token by one. It is cheaper today but repeats the churn on every insertion and makes it easy to mismatch a title and a look.

3. **Trail layout (Stops in order).**
   - Stretch 1 "Tu perro es un perro": `lesson('theory-named-behaviours')`, `lesson('theory-dog-as-dog')`, `lesson('howto-choose-action')`, `node('dog-as-dog')`, `mission('mission-dog-as-dog')`.
   - Stretch 2 "En casa se descansa": `lesson('theory-home-rest')`, `node('home-rest')`, `mission('mission-home-rest')`.
   - Stretch 3 "Primero, calma": `lesson('theory-calm-first')`, `node('calm-first')`, `mission('mission-calm-first')`.
   - "Tiene nombre" comes first because seeing that the dog is not unique is what makes owners open to learning.
   - `howto-choose-action` covers tapping an action button. `howto-tap-hold` stays before the Harness Ritual, now as a reminder for tapping plus the Hold gesture. Its tap card text is shortened, and it keeps its id so read state is unchanged.

4. **Three new read-dog scenes: `affection`, `rest` and `calm`.** Each has 4 beats and a ~5 s decision window, and ends with the Dog calm.

   | Scene | Actions (layout order) | State → correct action |
   |---|---|---|
   | `affection` | ignore, send-bed, marker, cuddle | `begging_lift` → ignore; `on_furniture` → send-bed; `relaxed_lying` (own bed) → marker; Cuddle is never correct |
   | `rest` | ignore, send-away, marker, go-outside | `nudging_attention` → send-away; `toy_indoors` → go-outside; `resting` → ignore; `relaxed_lying` (after being sent) → marker |
   | `calm` | wait, send-away, marker, cue | `barking_nonstop` → wait; `zoomies` → send-away; `sitting_attentive` → cue; `relaxed_lying` → marker |

   - `CORRECT_ACTION` is global today. A state can now mean different things in different scenes (`relaxed_lying` is always Marker, but `sitting_attentive` is Harness in `harness` and Cue in `calm`). So it becomes `CORRECT_ACTION[scene][state]`, with the existing two scenes' tables unchanged.
   - Scripts: the opening pair is shuffled by seed and the scene ends on `relaxed_lying`, the same pattern as `harness`.
   - Wrong-choice hints are per scene and action (`minigame.<scene>.hint.<action>`). Cuddle's hint says it treats the Dog like a toy. Cue on an over-aroused Dog says it can't learn yet.
   - Send away and Send to bed animate the Handler stepping toward the Dog with no contact. The Dog walks to its bed.
   - The new `MinigameKind` values are `dog-as-dog`, `home-rest` and `calm-first`. The Debrief metrics are `timing` and `tension`, like the Doorbell Mat.

5. **New Dog states and poses** in `ui/canine.ts`: `begging_lift`, `on_furniture`, `nudging_attention`, `toy_indoors`, `resting`, `barking_nonstop` and `zoomies`. Each has a caption and an emote. `resting` must differ from `relaxed_lying` (eyes closed and curled up, versus lying with its head up), and `barking_nonstop` must differ from `alert_barking` (facing the user, repeated bark emote, versus facing the door). The living-room scene props (sofa, dog bed, garden door) are a new `MinigameProps` set.

6. **Missions: three home Missions** in `missions/content.ts`, built with the existing `mission()` helper.
   - `mission-dog-as-dog`, reps 1: one full day with no lifting, no bed and no kisses, greeting only when calm. Problems: `cries`, `family`, `bed`.
   - `mission-home-rest`, reps 3: send away calmly when it asks for attention indoors, and play outside. Problems: `insists`, `barks`, `comesback`.
   - `mission-calm-first`, reps 2: wait for calm before asking for anything. Problems: `neverstops`, `escalates`, `givein`.
   - Home wording: the brief, success and Fix keys are per Mission already. The check-in question is shared today. Missions get an optional `place: 'home'` that selects `mission.checkin.question.home`. That field is the only change to the Mission model.
   - The Fix images use the themed placeholder until drawn, and are listed in `docs/content/stand-in-content.md`.

7. **Existing users: migration to `RECORD_VERSION = 8`.**
   - In `migrateRecord`, when the stored version is below 8 and the record has progress, union the `basics` Lesson ids into `readLessons` and its Node ids into `completedNodes`. Each `basics` Mission gets `{ ...NEW_MISSION, passedOn: <local date> }` unless it already has state.
   - Progress means `onboarding.firstStageCompletedAt` is set, or `completedNodes`, `readLessons` or `missions` is non-empty.
   - The migration adds no stars, no `activityLog` entries and no streak or Diary changes.
   - The `basics` Stop ids come from `WORLDS` (`stopsOf(findWorld('basics'))`), so the migration stays in step with the trail.
   - *Alternative:* a runtime grandfather rule in `doneness()`, like the pre-Missions one. Rejected: it adds a permanent branch to gating and makes "complete" depend on how the record was made. A one-time data write is simpler, and it is what the user asked for ("mark the world as completed").
   - Sync: an old app keeps uploading v7 copies. The new app migrates each one on read, so the union keeps `basics` complete. Reset Progress makes a fresh v8 record, so it is never marked.

8. **Lesson content** follows the existing `theoryLesson()` shape: steps, takeaways, two bundled images and, where useful, a do/don't compare. `theory-dog-as-dog` uses a compare for lifting, bed and kisses. `theory-named-behaviours` is a theory Lesson whose steps block lists the behaviours. Each step is "**Name** — what it looks like · why · first step".
   - Behaviours: the turtle (*hacer la tortuga*: the Dog lies down and waits, fixed on another dog that is coming, and often reacts once it gets close, so lying down is a warning sign, not calm), puppy zoomies, reacting to other dogs, redirected biting, plus nonstop barking, which links to Stretch 3.
   - It ends with a takeaway: "No es tu perro: es un perro. Y eso tiene arreglo."
   - Illustrations come from `scripts/render-lesson-art.mjs` with the shared kit.
   - Every string goes through the catalog, and the text must pass the no-physical-correction rule (spec `dog-basics-world`).

## Risks / Trade-offs

- [Tests and specs that assume `WORLDS[0]` is Home or use World numbers break.] → A dedicated task sweeps `src/**/*.test.ts` for `WORLDS[0]`, `worldNumber` and `'home'` assumptions. The example-only mentions in the `activity-diary`, `barkdoku-puzzle` and `mission-day-skip` specs are refreshed at archive time.
- [The migration runs on any v7 record, including one opened by a returning user on a new device before sync.] → That record has no progress, so it isn't marked. When the remote copy arrives, it is migrated and merged. This is the "Old copy synced later" scenario.
- [The training approach (no bed, no kisses, sending the Dog away) is opinionated, and some users will disagree.] → Copy stays calm and explanatory, never shaming. It explains why each rule helps the dog, and the no-physical-correction rule keeps it humane.
- [Seven new Dog poses is the largest art cost.] → Poses reuse the existing body kit (sit, lie, stand, jump) with changes to ears, tail and eyes. Living-room props are simple shapes.
- [Shortening `howto-tap-hold` changes a Lesson existing users have already read.] → Read state is by id and stays. Only the text changes.

## Migration Plan

1. Ship code and content together. On first launch, `migrateRecord` raises v7 records to v8 and marks `basics` complete where there is progress. It saves on the next write like any migration.
2. Rollback: an older app reading a v8 record treats unknown Stop ids as off-trail data. They are harmless, because `readLessons` and `completedNodes` are plain id lists. The older app then has no `basics` World, and Home is first again.

## Open Questions

- The final Spanish copy for Lessons, Missions and Fixes is drafted during apply and listed in `stand-in-content.md` until the user reviews it.
