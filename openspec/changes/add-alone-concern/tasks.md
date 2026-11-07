# Tasks

## 1. Concern id, onboarding exclusion and plan wiring

- [ ] 1.1 In `src/shell/concerns.ts` add `'alone'` last in `HOME_CONCERNS`; add `ONBOARDING_HOME_CONCERNS` / `ONBOARDING_CONCERNS` without it and make `readConcernList` drop `alone` from Main Concerns. Verify `npm run typecheck` flags every exhaustive `Record<HomeConcern, ...>` and `Record<Concern, ...>` that must now gain `alone`.
- [ ] 1.2 Use the onboarding lists in `src/shell/ui/ConcernPickers.tsx` and `src/shell/onboarding/questionnaire.ts`; keep `alone` in the Settings level picker. Add tests in `src/shell/onboarding/questionnaire.test.ts` that the onboarding options never contain `alone`, and that Main Concerns stay at most three.
- [ ] 1.3 Add `alone` to `CONCERN_KEYS` (`src/shell/concernText.ts`), `concern.alone` ("Se queda solo mal" or similar) in `src/i18n/es.ts`, and `CONCERN_STRETCHES` in `src/shell/onboarding/plan.ts` (`['theory-alone-space', 'theory-home-rest']`). Verify `src/shell/onboarding/plan.test.ts` has a case where `alone` at level 3 is ordered among the other concerns by level, and `src/i18n/i18n.test.ts` passes.

## 2. Home Behaviour registration and known gaps

- [ ] 2.1 In `src/shell/homeBehaviours.ts` add `alone` to `REQUIRED_PARTS` (all three) and `HOME_BEHAVIOUR_CONTENT` (`theory-alone-space`, `alone-door`, `mission-alone`), and set `KNOWN_GAPS` to `['alone:lesson', 'alone:node', 'alone:mission']` until task 6 ships. Verify `src/shell/homeBehaviours.test.ts` passes, including a test that the Other Home Behaviours row for `alone` is "coming soon" while the gaps exist.
- [ ] 2.2 Check whether `homeStretchOf` can hold several theory Lessons for one Stretch (design Open Question). If not, note the single-Lesson fallback in the content task 6.1. Verify with a test in `src/shell/homeBehaviours.test.ts` that the Stretch order is Lesson(s), Node, Mission.

## 3. Record field, version bump and migration

- [ ] 3.1 In `src/shell/dogRecord.ts` add `aloneAnswer?: 'ok' | 'sometimes' | 'bad' | 'unknown'` with an `isAloneAnswer` guard, read it in `migrateRecord`, and set `RECORD_VERSION = 11`. Verify in `src/shell/dogRecord.test.ts` that a v10 record reads as v11 with no answer and every other field equal, and that a junk value is dropped.
- [ ] 3.2 Add `answerAlone(record, answer)` (level 2 for `sometimes`, 3 for `bad`, none for `ok`/`unknown`, via `setHomeConcern`) and `shouldAskAlone(record)` (no answer, World 2 unlocked, `alone` has a Lesson). Make `setHomeConcern` for `alone` set an absent `aloneAnswer`. Verify tests for each of the four answers, for the `worldHome` join, for World 2 complete (stays in Otros), and for activation through Otros marking the question answered.
- [ ] 3.3 Add a test that `answerAlone` leaves `streak`, `walkDiary`, `activityLog`, `stars` deep-equal (spec: Answering is not progress).
- [ ] 3.4 Check `src/shell/reset.ts` / `reset.test.ts` clears `aloneAnswer` on Reset Progress like the other Dog fields; verify with a test.

## 4. Sync merge

- [ ] 4.1 In `resolve()` (`src/shell/sync/merge.ts`) keep `aloneAnswer` if either copy has it and carry the answering copy's `alone` level and `worldHome` membership when only the non-winning copy answered; update the doc comment. Verify in `src/shell/sync/merge.test.ts`: answered only on the older copy, answered only on the newer copy, answered on both differently (later `updatedAt` wins), neither answered. Also check `sync/schema.test.ts` / `sync.test.ts` round-trip the new field.

## 5. Question card and Otros entry

- [ ] 5.1 Create `src/shell/screens/AloneCheckCard.tsx` (heading, `withDogName` question, four buttons), modelled on `MissionCheckScreen` in `src/shell/screens/MissionScreens.tsx`. Add `alone.check.*` strings to `src/i18n/es.home.ts`. Verify with a component test (like `HomeBehavioursSection.test.tsx`) that the four answers call `onAnswer` with the right value and the Dog's name appears.
- [ ] 5.2 Wire it: `WorldMapScreen.tsx` gets `home.alone: { show, onAnswer }` rendered at the top of the "Para tu perro" section (from `home-rest-safe-space-and-world-two-sections`, which must make the section non-empty when the card shows); `Screen.tsx` provides it next to `onBecomeConcern`. If that section is not yet merged, render above the World 2 Home Stretches. Verify: card not shown when answered, with World 2 locked, or with no Lesson; shown with no other Home Stretch.
- [ ] 5.3 Make `alone` appear in `HomeBehavioursSection.tsx` when it is not a Concern (after "Muy bien" or "Aún no lo sé"), with `onBecomeConcern` setting level 1. Verify with a test in `HomeBehavioursSection.test.tsx`.
- [ ] 5.4 Verify manually on a test Dog (`npm start`) that answering gives no star, streak change or Diary entry, and a second device pair or reload does not show the card again.

## 6. Content and exercise (beta)

- [ ] 6.1 Author `content/beta/lessons/theory-alone-space/` (`lesson.yaml`, `es.md`, `media`) and the protocol Lesson (`theory-alone-protocol`, with `notice: lesson.note.alone`), following `content/FORMAT.md` section 4 and the outline in design decision 10. Add the notice string `lesson.note.alone` to `src/i18n/es.home.ts` and resolve its key in the lesson notice table. No leash-tension text; the crying rule has age and time limits.
- [ ] 6.2 Add the `alone` ReadDog scene and minigame kind (`src/shell/nodes/node.ts` `MinigameKind`, `nodes/readDog.ts`, `content/schema.ts`, `content/validator.ts` `isHomeNode`, `content/resolver.ts`, `ReadDogView.tsx` help key) and `content/beta/nodes/alone-door/` (`node.yaml`, `es.md`). Verify `src/shell/nodes/*` scene tests and `npm run content:validate -- --channel beta` pass.
- [ ] 6.3 Author `content/beta/missions/mission-alone/` (`place: home`, several-day brief with the step-by-step protocol, problems for cries at once, panic, and cries at the micro-close; check-in worded for home). Place Lessons, Node and Mission in the Stretch as the Home Stretch registration expects (Home Stretches are code-composed, not in `worlds/*.yaml`).
- [ ] 6.4 Add a content test (in `src/shell/homeBehaviours.test.ts` or `src/shell/content/formatConformance.test.ts`) that the alone Lesson has the notice, that no alone text matches downward leash tension, and that the crying rule text mentions an age and a time limit.
- [ ] 6.5 Remove the three `alone:*` entries from `KNOWN_GAPS`. Verify the coverage test passes and fails if one is re-added.
- [ ] 6.6 Have the Spanish text reviewed for the sensitivity and numbers in design decision 10 before promoting.

## 7. Promote and ship

- [ ] 7.1 Run `npm run content:validate -- --channel beta`, then `npm run content:promote` (this regenerates `src/shell/content/baseline.generated.ts` via `scripts/gen-baseline.mjs`). Verify the diff of `content/stable` and the baseline shows only the alone items, and `src/shell/content/promote.test.ts`, `parity.test.ts` and `build.test.ts` pass.
- [ ] 7.2 Update `docs/` if a new ADR is warranted (record that home concerns can be asked in-app, not only in onboarding); otherwise state in the PR that ADR 0023 still applies.

## 8. Final validation

- [ ] 8.1 Run `npm test`, `npm run typecheck`; both green (the repo has no lint script).
- [ ] 8.2 Run `openspec validate "add-alone-concern"`; no errors. Walk each scenario of `specs/alone-check/spec.md`, `specs/dog-concerns-plan/spec.md`, `specs/home-behaviour-training/spec.md` and `specs/account-sync/spec.md` against a test or the manual check in 5.4.

## Workflow follow-up

- Archive the change after review (`openspec archive add-alone-concern`), which syncs the delta specs into `openspec/specs/`.
