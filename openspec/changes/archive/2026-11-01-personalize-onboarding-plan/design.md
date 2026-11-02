## Context

`buildWalkPlan(latency, profile)` returns Node ids but only the plan card reads them. The funnel order is welcome, dog, taste, setup, diagnostic, plan, first-stage, paywall. The taste Stage is hard-coded to an approaching dog (`TASTE_SNAPSHOT.triggerProfile.dog = 3`), and the spec requires it before any setup question. World 1 is always the start of the map, and trail order is fixed by `WORLDS`.

## Goals / Non-Goals

**Goals:** capture the concerns, age and sex; first impressions (taste, plan card, map next-up) match the main concern; the plan is a single pure, testable function that is actually consumed.
**Non-Goals:** new Lessons/Nodes, changing unlocks, using the Dog's data for anything beyond ordering and wording.

## Decisions

1. **Up to three Main Concerns, plus a checklist.** The user picks up to three main concerns, the one that worries them most first, and may tick other concerns with intensity. Rationale: priority needs a tie-break the user controls; the existing chip/intensity UI is reused for the checklist. Alternative (rank all concerns) is slower and was rejected.
2. **Concern model.** `Concern = 'bite-owner' | 'bite-others' | 'bark-home' | 'destroy' | 'eat-objects' | 'react-dog' | 'react-child' | 'react-bicycle' | 'react-skateboard' | 'react-food'`. Outdoor `react-*` concerns write to the existing `triggerProfile` so the simulation keeps one source of truth; home concerns are stored as `homeConcerns: Partial<Record<HomeConcern, 1|2|3>>` and never reach the simulation. `mainConcern: Concern | null`, `ageBand: 'puppy'|'adolescent'|'adult'|'senior'|null`, `sex: 'male'|'female'|null` live in `DogRecord`.
3. **Prioritiser** `buildPersonalPlan(record): PlanItem[]` in `onboarding/plan.ts`, pure. Score per Stretch from a static table `CONCERN_STRETCHES: Record<Concern, StretchId[]>` (stretch = an existing entry of `WORLDS[].stretches`). Order:
   1. Safety tier: `bite-owner`/`bite-others` at any level put the home stretches first ("En casa se descansa", "Primero, calma") and `theory-named-behaviours` (redirected biting) as the first Lesson. `eat-objects` follows.
   2. Main concern's stretches next, then other concerns by level, then the default trail order fills the rest. Each `PlanItem` carries `{ stretchId, reason: { concern } }` so the card can say why.
   3. Age: puppy moves home-rest/calm-first up and delays leash-heavy Worlds; adolescent moves `poste-practice` up; senior drops nothing and only changes wording. Sex never changes order; it is used for pronoun wording and neutered-status is not asked.
   4. Slow Diagnostic latency still moves `poste-practice` up, after the safety tier.
   Plans are 3 to 5 items; unknown ids are dropped as today.
4. **Plan is used.** `onboarding.plan` becomes `PlanItem[]` (migration maps old string ids to items without a reason). Stretches inside a World are gated in order (a Stretch opens when the Mission before it is passed), so next-up alone could never follow the plan. `worldsFor(plan, progress)` therefore orders the Stretches of each World per Dog: started Stretches keep their place, then the plan's Stretches in plan order, then the rest in trail order. Worlds, World unlocks and the Stops of a Stretch are unchanged. `mapModel` then takes the first open plan Stretch as next-up (falling back to trail order) and the map draws a "Start here" marker on it. A plan item in a locked World is skipped. The Library's "Mundo N · Tramo M" labels still use the shipped order.
5. **Funnel order.** `welcome, dog, concern (new), taste, setup, diagnostic, plan, ...`. `concern` asks the Main Concerns only: one screen, up to three taps, skippable. The other Concerns (with intensity), age and sex join the `setup` step. ADR 0019 narrows ADR 0010's "before any setup question" to "before any question other than the Main Concern".
6. **Taste Stage stays a leash Stage.** `tasteScenarioFor(mainConcerns)` parametrises the Distractor kind of the first outdoor pick (dog, child, bicycle, skateboard, food); for a Home Behaviour or no Main Concern it uses the approaching dog. The Payoff Screen wording follows the Main Concern and, for a Home Behaviour, says the Concerns will be tuned in the plan. A separate at-home taste was rejected: it would not be a Stage and would break the glossary's Taste Stage and Payoff Screen.
7. **Migration.** Bump the record version; defaults `mainConcerns: []` (a record saved with the single `mainConcern` keeps it as the first entry), `homeConcerns: {}`, `ageBand: null`, `sex: null`. A null main concern builds the old default plan, so existing users see no change. A user already past `setup` is not re-asked; settings gets an "About your dog" editor.

8. **Notes are derived.** `planNotes(record)` returns the professional-help note when `bite-owner` or `bite-others` is at level 2 or 3, and the supervision note when `child` in the Trigger Profile is level 3. Nothing is stored, so lowering a level in settings or by training removes the note. The professional-help note also tops the first biting Lesson once it exists.
9. **Home Behaviours section on the map.** One Stretch per Home Behaviour, grouped in a section that reuses the "collapse Completed Worlds to a header row" behaviour. A Stretch whose Concern level is 0 collapses to "{Behaviour} · not a concern for {name}", stays tappable, and a "this is a concern now" action sets the level to 1. Nothing is hidden and nothing the user did disappears. Not-a-Concern Stretches are excluded from completion, unlock and progress counts; a Concern Stretch counts toward its own progress only and gates no World.
10. **Content gap guard.** A coverage test requires each Home Behaviour to have a Lesson, a Node and a Mission. Until the follow-up lands an explicit `KNOWN_GAPS` list names the missing ones; the test fails if a gap is closed without removing its entry or a Home Behaviour is added without content. Placeholder Stretches (preview-World style, "coming soon") fill the gaps, and `add-home-behaviour-training` plans the real content.
11. **Age and sex.** Age bands: puppy under 6 months, adolescent 6-18 months, adult 18 months to 7 years, senior 7 and over; unset acts as adult. Age only reorders. Sex is stored for pronouns only; unset gives "they".
12. **Existing users.** Their plan is left alone; an "About your dog" editor in settings adds the answers later and rebuilds the plan.

## Risks / Trade-offs

- [Home Behaviours have no training content yet] -> placeholders say "coming soon" honestly, the plan points to the nearest existing Stretches, and the coverage test plus `add-home-behaviour-training` keep the gap visible.
- [Biting and children are safety matters, and an app is not a behaviourist] -> two derived, non-blocking notes (professional help for biting level 2-3, supervision and distance for children level 3).
- [Longer onboarding] -> only one question before the taste; the rest sits in the existing setup step with skip allowed.
- [Plan items in locked Worlds] -> shown but not forced; next-up skips locked items.

## Migration Plan

Dog record version bump with default fields; old `plan: string[]` converted on load; no data loss; rollback is ignoring the new fields.

## Open Questions

- The exact Stretch each Home Behaviour maps to until real content exists (proposed in tasks 2.1; content owner to confirm).
