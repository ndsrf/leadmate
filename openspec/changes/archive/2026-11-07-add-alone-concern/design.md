# Design

## Context

See proposal.md for motivation. Current state, from the code:

- `HOME_CONCERNS` (`src/shell/concerns.ts`) lists five ids. `homeConcerns` on the Dog record maps each to level 1 to 3. `CONCERNS` (home plus outdoor) feeds the onboarding Main Concern chips (`ConcernPickers.tsx`), and `HOME_CONCERNS` feeds the onboarding level pickers and `questionnaire.ts`.
- Each Home Behaviour maps to Lesson, Node and Mission ids in `HOME_BEHAVIOUR_CONTENT`, with `REQUIRED_PARTS` and `KNOWN_GAPS` (`src/shell/homeBehaviours.ts`, currently empty). Content lives in `content/beta` and `content/stable` and is compiled into `baseline.generated.ts` by `npm run content:promote` (ADR 0025).
- Home Stretches belong to World 2 for a declared Concern (`homeStretchesInWorldTwo`, `worldHome`, ADR 0023). `setHomeConcern` makes a Stretch join World 2 unless World 2 is complete. "Otros comportamientos de casa" (`HomeBehavioursSection.tsx`) lists the rest and offers `onBecomeConcern` ("Ahora es un problema", level 1).
- `RECORD_VERSION` is 10 (`dogRecord.ts`). Sync `resolve()` (`sync/merge.ts`) takes the later `updatedAt` whole and unions growing collections (ADR 0006, 0007).
- The "Para tu perro" section exists (from the completed `home-rest-safe-space-and-world-two-sections`); the card mounts in it. The alone Lesson refers to the rest space of `theory-home-rest` without repeating it.
- `theory-home-rest` is extended by that other change. The alone Lessons should refer to the rest space it describes and not repeat it.

## Goals / Non-Goals

**Goals:**
- A sixth Home Behaviour, `alone`, that behaves exactly like the other five once it is a Concern.
- A one-time card that sets its level, never counts as progress, and survives sync.
- Safe content for a sensitive topic (separation distress).

**Non-Goals:**
- Changes to onboarding, to the three Main Concern limit, to World numbering or to unlock rules.
- A general "question card" framework. One card is built for `alone`; a second would justify the abstraction.
- A separation-anxiety diagnosis. The card is a triage hint, not a measurement.

## Decisions

**1. Concern id `alone`, added to `HOME_CONCERNS` last.**
Biting stays first in the order; `alone` goes at the end, so existing ordering, plan tie-breaks and `homeStretchStops` are unchanged for old Dogs. `REQUIRED_PARTS.alone` is all three parts. `HOME_BEHAVIOUR_CONTENT.alone = { lesson: 'theory-alone-space', node: 'alone-door', mission: 'mission-alone' }`. A Home Stretch is identified by its first Lesson (`isHomeStretchId`), so the Lesson ids must be unique; the Stretch's other Lessons are listed in the content, not in this map (see decision 6).
Alternative: a separate flag outside `HOME_CONCERNS`. Rejected: Personal Plan, World 2 membership, Other Home Behaviours and the coverage test all key off `HOME_CONCERNS`, and bypassing it duplicates all of them.

**2. Onboarding must not offer `alone`.**
Adding to `HOME_CONCERNS` would leak it into the onboarding chips and level pickers. Introduce `ONBOARDING_HOME_CONCERNS = HOME_CONCERNS minus 'alone'` and `ONBOARDING_CONCERNS` in `concerns.ts`, used by `ConcernPickers.tsx` (Main Concern chips and onboarding levels) and `questionnaire.ts`. The Settings level picker may list `alone` (assumption: yes, so a user can change the level later, as the spec says "changeable like any other Concern level"). `readHomeConcerns` and `readConcernList` stay general so stored data is read the same way; `readConcernList` must drop `alone` from Main Concerns (`isMainConcernable`).

**3. The answered-once flag is the answer itself: `aloneAnswer?: 'ok' | 'sometimes' | 'bad' | 'unknown'` on the Dog record.**
Absent means never asked. Storing the answer, not just a boolean, lets merge reason about it and lets the card be rebuilt for support. Setting `alone` as a Concern by any other route (Other Home Behaviours, Settings) sets `aloneAnswer` to `'sometimes'` or `'bad'` by level only when it is still absent, so the card never shows afterwards; level 1 maps to `'sometimes'` (the card has no level 1; only the "asked" state matters). Pure helpers in `dogRecord.ts`: `answerAlone(record, answer)` (sets the answer, calls `setHomeConcern` with level 2 for `sometimes`, 3 for `bad`, nothing for `ok` and `unknown`, and bumps `updatedAt` through the normal save path) and `shouldAskAlone(record)` (answer absent and World 2 unlocked).
Alternative: a boolean `aloneAsked`. Rejected: after a merge, a boolean cannot tell which copy's level to keep (see 4).

**4. Record version 10 to 11; migration is additive.**
`RECORD_VERSION = 11`. `migrateRecord` reads `aloneAnswer` with a guard (`isAloneAnswer`) and drops anything else. A record below 11 has no answer and no other change: there is no data to move, so the migration function is a no-op beyond the version stamp, but the bump is required so the field is not silently dropped by devices that still migrate at 10 (an old build re-saving an 11 record loses the field: accepted, the card then reappears there at worst). A test shows a v10 record reads to v11 with the answer absent and every other field equal.

**5. Sync merge: answer present on either side survives; the level travels with the answer.**
In `resolve()`: `aloneAnswer = base.aloneAnswer ?? other.aloneAnswer`, where `base` is the later-`updatedAt` copy. When `base` has no answer and `other` does, `homeConcerns.alone` and `worldHome` membership for `alone` are taken from `other`, because the level is the consequence of that answer and the whole-record rule would otherwise lose it (a stale device with a later `updatedAt` would cancel the answer's level but keep the answer). When both have an answer the base copy's answer and level win. Other `homeConcerns` keys keep the whole-record rule. This is the only merge exception; it is added to account-sync "Conflict resolution".
Alternative: union `homeConcerns` per key. Rejected: it would stop a user lowering a level to 0 on one device.

**6. One Stretch, protocol in the Mission.**
The Stretch has one Lesson (`theory-alone-space`), the Node and the Mission. `homeStretchOf` allows one id per part and the Stop model is not changed. The Lesson orders its content: panic and when-to-stop `notice` first, then the small space (playpen plus crate), then the protocol, then pre-departure routine and crying (frustration vs panic). The Mission is `place: home`, `reps` large enough for several days, with `problems` for the failure modes (cries at once, panics, cries when the door closes). It uses the normal check-in, Fix and Day Skip rules; no `real-world-missions` change is needed (see proposal note). `alone` stays separate from Barking and Destroying: answering "Mal" sets only `alone`, and the Lesson says to follow this Stretch when the barking or damage happens only while the owner is away.
The Mission is `place: home`, `reps` large enough for several days, with `problems` for the failure modes (cries at once, panics, sleeps on its own but cries when the door closes). It uses the normal check-in, Fix and Day Skip rules; no `real-world-missions` change is needed (see proposal note). Success sign: the Dog tolerates the micro-close and the release cue without distress.

**7. The question card is a presentational component fed by pure functions.**
`AloneCheckCard` (new, `src/shell/screens/AloneCheckCard.tsx`) is modelled on `MissionCheckScreen`: a heading, the question with `withDogName`, four `Button`s. It renders inside the World 2 frame, above its path, as a flowing element so the fixed stop offsets are untouched; it shows even when the Dog has no Home Stretch there. `WorldMapScreen` receives `home.alone: { show: boolean; onAnswer(answer) }`; `Screen.tsx` wires it like `onBecomeConcern`. It shows only when World 2 is unlocked (not folded and not preview) so a brand-new Dog is not asked on day one. Strings go to `src/i18n/es.home.ts` as `alone.check.*`; Spanish only, English falls back.

**8. Answering is not progress.**
`answerAlone` touches only `aloneAnswer`, `homeConcerns`, `worldHome` and `updatedAt`. It must not call `markActive`, `addDiaryEntry`, `addActivity` or stars code. A test asserts `streak`, `walkDiary`, `activityLog` and `stars` are deep-equal before and after, matching the "not progress" stance of `mission-day-skip` (a Day Skip is not an Active Day).

**9. The exercise is a choose-the-action minigame, a new ReadDog scene.**
Node `alone-door`, `mode: minigame`, minigame kind `alone`. Scenes ask what to do ("¿abro o no abro?"): wait because it is frustration, open because it is panic or the time limit is reached, reward a calm moment, shorten the step. The new kind must be added where the other home minigames are listed: `MinigameKind` in `nodes/node.ts`, `readDog.ts` (scene, beats, salts, action map), `content/schema.ts`, `content/validator.ts` (`isHomeNode`), `content/resolver.ts`, `ReadDogView.tsx` help key. No bite or failure state; wrong choices explain why.

**10. Content-safety adjustments (from the proposal).**
- No downward leash tension. The source course's Lesson 3.2 advises it; the authored text drops it entirely and teaches a loose or no leash. The content test greps the alone content for "tensi" near "abajo" to prevent regression.
- Panic and when-to-stop note before the protocol, as `notice` on the Lesson (the mechanism used by `theory-bite-owner`: `notice: plan.note.professional`). A new notice key `lesson.note.alone` is added to the notice table; it describes panic signs (drool, trying to escape, not eating treats, destruction at the door) and says to stop and consult a vet or certified behaviour professional.
- The don't-open-while-crying rule is bounded: applies to dogs of about 4 months and over; for younger puppies wait much less (seconds to a couple of minutes) and open at the first sign of panic; for every dog stop the exercise and open the door after a stated maximum (the source's 45 minutes is replaced by a conservative figure to be fixed by the content reviewer, default 10 minutes of continuous crying for adults and 2 for puppies under 4 months). Numbers are content, not code, so they can change without a release.
- Lesson outline (one Lesson, `theory-alone-space`; Spanish source: "soledad y espacios seguros"): panic note first; "El espacio pequeño" (why a small space calms, link to `theory-home-rest`; parque y transportín, never as punishment); "Protocolo sin fuerza" (open door, distance, micro-close, release cue meaning "you may leave", never a forcing command); "Antes de salir y el llanto" (routine, calm departures, frustration vs panic).

## Risks / Trade-offs

- [Sensitive topic: separation distress] → notice first, professional-help wording, explicit limits, review of the Spanish text by the content owner before promotion to stable.
- [Adding to `HOME_CONCERNS` leaks `alone` into onboarding] → decision 2 with a test that the onboarding option lists never contain it.
- [Level lost in sync] → decision 5 with merge tests for both directions.
- [Old builds drop `aloneAnswer`] → accepted; worst case the card shows again.
- [Asking a puppy owner with a young Dog is premature] → card waits for World 2 unlock; a "Muy bien" answer costs one tap.
- [Dependency on the other change for "Para tu perro"] → that change is complete; the card mounts directly in the section.
- [Single Lesson carries a lot] → the panic notice comes first, the Mission carries the day-by-day steps.

## Migration Plan

1. Land code (types, record, sync, UI) with `alone` content absent: `KNOWN_GAPS = ['alone:lesson', 'alone:node', 'alone:mission']`, so the coverage test passes and the Stretch is a "coming soon" row in Other Home Behaviours; the card stays hidden while `alone` has no Lesson (`hasDedicatedLesson`).
2. Add content in `content/beta` and validate. Remove the gap entries in the same commit that makes the content resolve.
3. Promote to stable and regenerate `baseline.generated.ts`; publish beta/stable as usual (ADR 0025).
4. Rollback: revert the content (re-add the gap entries). The record field is additive and harmless if unused.

## Open Questions

- Resolved: `homeStretchOf` takes one id per part, so the Stretch has a single Lesson, `theory-alone-space`, and the Stop model is unchanged.
- Resolved: crying limits default to 2 minutes for puppies under 4 months and 10 minutes for older dogs (open at the first sign of panic); the content owner reviews the Spanish text before promotion to stable.
