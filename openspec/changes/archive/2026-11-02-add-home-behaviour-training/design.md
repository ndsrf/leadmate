# Design

## Context

See proposal.md - Why. State of the code this builds on:

- `src/shell/homeBehaviours.ts` holds `HOME_BEHAVIOUR_CONTENT` (per concern: `lesson`, `node`, `mission` ids, all empty today) and `KNOWN_GAPS`, which is generated from `CONTENT_PARTS` and checked against `contentGaps()` by `homeBehaviours.test.ts`. Every concern is required to have all three parts.
- `HomeBehavioursSection` (World Map) renders one folded row per behaviour with a "coming soon" body; it has no way to open a Lesson, Node or Mission yet. These Home Stretches are not in `WORLDS`.
- "Read the Dog, pick the action" already exists as `readDog.ts` + `ReadDogView`: a scene is a short script of Dog states, one action fits each state (`SCENE_ACTIONS`, `CORRECT_ACTION`, `buildScript`, `hintKey`). Five scenes ship; Nodes reach it through `NodeDef.mode: 'minigame'` and `SCENE_OF_MINIGAME`. Its results (`timing`, `tension`, `handlingScore`) already feed stars and the Diary.
- Lessons are `theoryLesson(id, spec)` over catalog keys; Missions are `mission(id, slug, ...)` over catalog keys with a `trains: Stop[]` and Fixes. `missionOfStop` finds a Stop's Mission through `WORLDS`, so it returns nothing for these Home Stretches. The app ships Spanish only (`SUPPORTED_LANGUAGES = ['es']`).
- `plan.note.professional` already exists as the professional-help text of the plan.

## Goals / Non-Goals

**Goals:**
- Close every `KNOWN_GAPS` entry with content that follows the existing Lesson, Node and Mission patterns, reusing engines instead of building new ones.
- Keep Home Behaviours outside the trail's gating, completion and unlock totals, as they are now.

**Non-Goals:**
- No use of the close 2D sim view (`close_exercise`): it is a leash drill and none of these behaviours fit it.
- No exercise, simulated or otherwise, for the two biting behaviours.
- No new scoring system; scoring of the new scenes reuses the existing Minigame metrics.

## Decisions

### 1. Exercises are new read-the-Dog scenes, not a new view

Add three `ReadDogScene`s (`bark-home`, `destroy`, `eat-objects`) and three `MinigameKind`s mapped in `SCENE_OF_MINIGAME`. Each scene supplies its states, `SCENE_ACTIONS`, `CORRECT_ACTION`, `buildScript` branch and `minigame.<scene>.*` catalog texts. `ReadDogView`, the Node plumbing, the Debrief, stars and the Diary are unchanged.

Alternatives: a new bespoke minigame per behaviour (five times the UI work, nothing gained); the close sim (needs new controls, scenarios and metrics, and does not model home problems). Rejected.

Scoring: reuse `timing` and `tension` (as "calm choices") like the other Basics-style scenes, so no new metric and no Debrief change. Scoring is not a priority for this change.

New states and actions (e.g. a chewed object, the Dog picking up something it should not) need postures in `ui/canine.ts`; where an existing posture fits it is reused, and a missing art asset falls back to the nearest posture rather than blocking the content.

### 2. Required parts per concern, not a permanent known gap

The two biting concerns have no exercise by design. Replace the flat `CONTENT_PARTS` requirement with `REQUIRED_PARTS: Record<HomeConcern, readonly ContentPart[]>` (`bite-owner` and `bite-others`: `lesson`, `mission`; the rest: all three). `contentGaps()` and `KNOWN_GAPS` iterate the required parts only, so a biting concern's closed gap set is empty without a phantom `:node` entry. `homeBehaviourProgress` already skips absent parts, so its totals stay right.

Alternative: leave `:node` for biting in `KNOWN_GAPS` forever (CI then never goes green on the invariant "KNOWN_GAPS is empty when content is complete"). Rejected.

### 3. Biting: one Lesson per behaviour, safe handling first

Two Lessons (`bite-owner`, `bite-others`) built with `theoryLesson`, since the cause and safe response differ (owner: guarding, play biting, frustration; other people: fear and warning signs, managing contact, avoiding scenarios). The professional-help note is the first block of both, reusing the `plan.note.professional` wording through a new Lesson block text, then safe handling (avoid triggers, management, never punish, how to separate). Their Missions train a Lesson Stop (`trains: [lesson(...)]`), not a Node, which the `Stop` type already allows (`mission-poste` Fixes do this).

Open question resolved: biting the owner and biting others stay **two** Home Stretches. The shared note and some steps are written once as shared keys.

### 4. Eating non-food: training plus a vet branch

One Lesson, one scene, one Mission. The Lesson separates "teach it" (leave-it and trade) from "see a vet" (swallowed objects, repeated pica, signs of obstruction), with the vet note shown early like the biting note. The scene only rehearses the safe response (swap, never chase or grab). The vet text is one shared catalog key, used by the early Lesson block and by the Mission's Remediation, so a failed check-in on swallowing points to the vet instead of only offering an easier target.

### 5. Missions outside `WORLDS`

`missionOfStop` and Debrief's "closing the Debrief opens the Mission brief" depend on a Stretch in `WORLDS`. Home Stretches are not in a World, so the Home Behaviours section defines its own order per concern (`lesson` → `node` → `mission`) and opens each directly. Mission focus and Diary entries use the mission id as today; A Home Mission keeps the check-in, "Hoy no pudimos" and Remediation but has no Day Skip and is never Owed (it closes no Stops); `missionOfStop` is left untouched and the Debrief for a Home Node returns to the Home Behaviours section.

### 6. Home Behaviours section opens the content

`BehaviourRow` replaces the "coming soon" body with up to three buttons (Lesson, Exercise, Mission), each shown only when the part exists, with a per-part done check from `homeBehaviourProgress`. "Coming soon" remains for a behaviour with no Lesson.

A behaviour that is not a Concern (`entry.isConcern` false) keeps its folded header; opened, the Lesson button stays enabled (a Lesson is reference reading, always open from the Theory Library) while the Exercise and Mission buttons are disabled with the existing "not a problem for {name}" wording, next to the existing "Ahora es un problema" button, which sets the level to 1 and enables them. The Personal Plan is pure over levels and already puts any biting level above 0 first, so this button re-ranks the Plan; the professional-help note only appears from level 2. Alternatives: hide the content until it is a Concern (owners cannot preview it), or always enable it (the questionnaire would not change what is offered). Rejected. The Personal Plan's existing pointers are updated too: `CONCERN_STRETCHES` in `onboarding/plan.ts` names the new Home Stretches for the home concerns instead of the nearest existing material.

### 6b. Superseded: Home Stretches live in World 1 (ADR 0021)

Decisions 5 and 6 above are superseded where they say Home Stretches sit outside the Worlds. A Home Stretch of a Concern the Dog has is a Stretch of World 1, ordered by the Personal Plan (biting first), after any Stretch it depends on through Node prerequisites, and it gates World 1 and carries the normal Mission rules (check-in, "Hoy no pudimos", Day Skip, Owed). The others sit in Other Home Behaviours, collapsed by default and hidden when empty, with Lesson, Exercise and Mission enabled and "Ahora es un problema" moving the Stretch into World 1 at level 1. A Home Stretch declared after World 1 is complete stays in Other Home Behaviours; a started one stays in World 1 if the Concern is removed. `missionOfStop` and the Debrief then work for them through the Worlds, and the lock for "not a problem" is removed. World 2 (the first locked World) is also folded to its header by default.

Order and Lessons (6c). World 1 for a Dog is: biting Home Stretches (no Node, safety first), the Basics Stretch "Un perro, no un peluche" (how to play, named behaviours, dog-as-dog, Node, Mission), the other Home Stretches in Personal Plan order (by level; those the plan's five items omit follow by level), then Basics home-rest and calm-first. `howto-choose-action` is the first Stop of World 1 and every read-the-Dog living-room Node (`requiredLessonsOf`) needs it read; `worldsFor` treats that like a Node prerequisite, so such a Stretch never sits before the Stretch holding the Lesson. Off the trail (Other Home Behaviours) a Home Node does not require it: that section is optional and gates nothing, and blocking a button there would be the more surprising outcome. The Lessons of a Stretch are open together; only a Node or Mission is gated by the Stops before it in its Stretch.

### 7. Content, language and review

All text goes in the Spanish catalog (the only shipped language). Content is written to `docs/content/lesson-guide.md`. A named reviewer for the safety content is a release gate in the tasks, not something the app enforces.

## Risks / Trade-offs

- [Content quality and safety on biting] → Lessons lead with the professional note, avoid any trial-and-error exercise, and the tasks include a human review gate before the biting and eating-objects gaps are removed.
- [Missing canine art for new states] → reuse nearest existing postures first; art can follow without blocking.
- [`REQUIRED_PARTS` changes a tested invariant] → update the coverage tests in the same step so they still fail when content exists without its gap entry being removed.
- [Debrief and Mission flow differ from World Stretches] → a small, explicit Home Stretch path rather than touching `missionOfStop`; covered by tests.
- [Scenes are shallow compared with a sim] → accepted: home problems are management and timing decisions, which this engine already teaches.
