## Context

The `taste` onboarding step maps to the `taste` route. In `App.tsx` an effect on that route immediately calls `startStage(tasteScenario, …)`, and the payoff is a local `tastePayoff` flag with `PayoffOverlay` drawn over the running Stage (`IntroScreens.tsx`). Back handling is the pure `backAction` in `navigation.ts`, which already takes a `payoff` flag that is consumed. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Tell the user, before the simulator appears, what to do and what the goal is.
- Keep the taste Stage unchanged, and unaffected by reading time.

**Non-Goals:**
- No change to Coach marks, the warning, the scenario, the payoff or Dog setup.
- No new persisted onboarding step or Dog record field.
- No animation or illustration; text only (can follow later).

## Decisions

- **Local state, not a new step.** A `tasteBriefed` flag in `App.tsx`, reset to false whenever the route becomes `taste`, mirrors `tastePayoff`. A persisted step would force a migration of `ONBOARDING_STEPS`, `pageForStep`, resume logic and tests for no benefit; reopening on the briefing is the desired behaviour anyway.
- **Delay the Stage start.** The route effect starts the Stage only once `tasteBriefed` is true, so the 20 s limit and the approaching dog begin after the user presses the button. Alternative considered: start the Stage paused behind an overlay (like `PayoffOverlay`); rejected as it loads and renders the sim behind a screen whose point is to be read, and risks the bundle-loading back/pause states.
- **Briefing as a full screen in the taste route.** A new `TasteBriefScreen` in `IntroScreens.tsx` using the same `Screen`/`Panel`/`Button` and `withDogName` pattern as the other intro screens, instead of the current `screen = null` for taste. While it shows, the Stage is not `playingStage`.
- **Back.** Reuse the `payoff`-style consume path: add a `briefing` param to `backAction` that returns `consume`.
- **Copy** (es catalog, `{name}` substituted, neutral fallback via `dog.neutral`): title "Pasea a {name}", lines "Vas a pasear a {name}. Otro perro se acerca.", "Tu objetivo: que {name} se mantenga tranquilo.", "Arrastra para alejarlo del otro perro.", button "Empezar". The Marker is not mentioned because the taste has `markBudget: 0`. The goal is stated honestly but without promising success: ADR 0010 keeps the Stage built to fail, and the payoff reframes it.
- **Stage unchanged.** The scenario, the Coach marks and the payoff are untouched; making the taste winnable is out of scope.

## Risks / Trade-offs

- The text mentions dragging before the user sees the control; the Coach marks reinforce it once the Stage starts. Keep it to three short lines.
- Users who try hard still end Reactive; the payoff wording ("pasear a {name} no es fácil") covers it.
- Taste payoff and briefing both consume back; ensure the flags are mutually exclusive (briefing true only before the Stage starts).
