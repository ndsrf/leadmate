## 1. Data model

- [x] 1.1 Add `mainConcern`, `homeConcerns`, `ageBand`, `sex` to `DogRecord` with defaults and a version bump and migration in `dogRecord.ts`; convert `onboarding.plan` from `string[]` to `PlanItem[]` on load
- [x] 1.2 Add setters (`setMainConcern`, `setHomeConcern`, `setAgeBand`, `setSex`) with tests, following `setTriggerLevel`

## 2. Prioritiser

- [ ] 2.1 Write the Concern to Stretch table (Home Behaviours mapped to `theory-named-behaviours`, `theory-home-rest`, `theory-calm-first`; outdoor Concerns to the existing Nodes) and confirm it with the content owner
- [x] 2.4 Derive the two safety notes from current levels (`planNotes`), with tests for levels 1, 2, 3 and for lowering a level
- [x] 2.2 Replace `buildWalkPlan` with `buildPersonalPlan(record)` in `onboarding/plan.ts`, with reasons; unit tests for each spec scenario (biting leads, outdoor main concern, puppy, nothing answered, sex has no effect)
- [x] 2.3 Rebuild the plan in `recordDiagnostic` and whenever concerns, age or the latency change in settings

## 3. Funnel

- [x] 3.1 Add the `concern` step to `flow.ts` between `dog` and `taste`, with persistence/resume and `navigation.ts` routing; keep users already past it unaffected
- [x] 3.2 Build the main concern screen and add home-concern chips, age band and sex to `SetupScreen`; keep skip on each
- [x] 3.3 Parametrise `tasteScenario` by the Main Concern's Distractor kind (approaching dog otherwise) and the Payoff wording; keep the scripted-input reaction test for each kind
- [x] 3.5 Write ADR 0019 follow-through: update ADR 0010 with a pointer to it
- [x] 3.4 Update `PlanScreen` to show reasons per item with the Dog's name, the "dedicated lessons coming" line and the safety notes

## 4. Map and settings

- [x] 4.1 Make `world.ts` next-up follow the plan (first unlocked incomplete item) and draw the "Start here" marker in `WorldMapScreen`; tests for locked items and empty plan
- [x] 4.2 Add an "About your dog" editor to `SettingsScreen` for concerns, age and sex that rebuilds the plan

- [x] 4.3 Add the Home Behaviours section: one Stretch per Home Behaviour, collapsed and marked not a concern at level 0 (reusing the completed-World collapse), expandable, with "this is a concern now"; exclude non-Concern Stretches from completion, unlocks and progress; "coming soon" placeholders for missing content
- [x] 4.4 Add the content coverage test with the `KNOWN_GAPS` list

## 5. Copy and verification

- [x] 5.1 Add i18n keys for every supported language (questions, chips, age bands, sex, reasons, safety note)
- [ ] 5.2 Run the existing onboarding, world and dogRecord tests and fix regressions; check the funnel on a 360 by 640 screen with large text
