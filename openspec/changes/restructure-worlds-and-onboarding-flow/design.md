# Design

## Context

In the current implementation, `worldsFor()` in `src/shell/world.ts` merges the dog's declared `homeConcerns` directly into World 1 (`basics`). When an owner declares multiple concerns (e.g. biting, barking, destruction), World 1 expands up to 8 stretches, each culminating in a real-world Mission with check-in timers. This forces new users into a multi-week bottleneck before reaching World 2 ("Casa y umbrales") or outdoor walking. Furthermore, owners lack visibility into the core training loop and app features (Guaudoku, Daily Walk), and biting theory lacks actionable early-stage prevention and de-escalation protocols.

## Goals / Non-Goals

**Goals:**
- Make World 1 a fixed, lightweight 3-stretch foundation ("Los cimientos") for all dogs, completing in 2-3 days.
- Place declared Home Stretches in World 2 ("Casa y umbrales / Convivencia") ahead of threshold stretches, ordered by the personal plan (biting first).
- Keep both World 1 and World 2 in the free tier so home behavioral issues are not blocked by a paywall.
- Add an onboarding step explaining the 3-step loop (Theory → Simulator → Mission) and core recurring features (Guaudoku, Daily Walk).
- Provide a personalized reassurance note in onboarding explaining that declared concerns are tackled in World 2 after foundational basics.
- Enrich biting theory with the canine ladder of aggression / stress traffic light, environmental management, and the trade-up ("intercambio") protocol.

**Non-Goals:**
- Implementing new close-view biting minigames (kept open while close-view game mechanics are researched).
- Re-architecting outdoor worlds (World 3 onwards remain untouched).
- Changing mission cooldown mechanics or day-skip rules.

## Decisions

### 1. Relocate Home Concerns from World 1 to World 2
- **Choice**: In `src/shell/world.ts`, `worldsFor()` injects `homeStretchesInWorldOne()` into World 2 instead of World 1 (`world.id === 'home'`).
- **Order within World 2**: Declared Home Stretches come first (ordered by Personal Plan, biting first), followed by the existing World 2 threshold Stretches (Harness Ritual, Doorbell Mat, Poste practice).
- **Alternative considered**: Creating an intermediate "Mundo 1.5" or making home concerns the first world. Rejected because owners need the core communication and calm mechanics taught in World 1 before tackling severe arousal or aggression, and shifting the numbering of worlds would break established progress and specs.

### 2. Onboarding Method & Ecosystem Overview
- **Choice**: Insert a dedicated `method` step into `ONBOARDING_STEPS` in `src/shell/onboarding/flow.ts` right after `plan`.
- **Content**: Visual cards detailing:
  1. *El Camino*: Theory (2 min) → Simulator (muscle memory) → Real-world Mission.
  2. *El Paseo del Día*: Daily streak and real-time walk score.
  3. *Guaudoku*: Daily spatial deduction puzzle for canine distance awareness.
  4. *Reassurance Note*: Explicitly confirming that their declared concerns ({concerns}) are scheduled in World 2 right after the 3 basic foundations.
- **Alternative considered**: Explaining these concepts on the World Map itself. Rejected because the map screen is already dense and modal popups on first map load cause cognitive overload.

### 3. Actionable Prevention in Biting Theory
- **Choice**: Update Spanish catalog entries for `trail.theory-bite-owner` and `trail.theory-bite-others` to incorporate:
  - The Canine Escalation Ladder (micro-signals of stress in the "yellow zone": lip licking, yawning, body freeze).
  - Environmental management (safe spaces, no-approach feeding zones).
  - Tactical protocols: Trade-up ("intercambio") with high-value treats tossed 2 meters away instead of physically taking items, and reverse timeout (leaving the room calmly) during mouthy play.
- **Alternative considered**: Creating a simulated bite event in the simulator. Rejected in ADR 0022 and reaffirmed here; close-view interaction will be designed separately.

## Risks / Trade-offs

- **[Existing user progress regression]** → If an existing user is currently progressing through World 1 with home concerns, moving those concerns to World 2 must not erase or orphan completed stops. `world.ts` already tracks completion via `completedNodes`, `readLessons`, and `missions` independently of stretch placement.
- **[Persisted `worldHome` meant World 1]** → `RECORD_VERSION` 10 re-reads the list once: dropped unless World 2 is already complete. A Home Stretch the Dog already started stays open while World 2 is still locked.
- **[Onboarding funnel step persistence]** → Adding a step (`method`) to `ONBOARDING_STEPS`: Existing users in the middle of onboarding will resume cleanly because `nextStep()` and `inFunnel()` operate by array index.
- **[World 2 completion time increased for dogs with concerns]** → While World 2 is longer for dogs with many concerns, this aligns expectations: home problems are addressed in the home world, while World 1 provides immediate momentum.

## Migration Plan

1. Update `src/shell/world.ts` and `src/shell/homeBehaviours.ts` to attach home stretches to `world.id === 'home'`.
2. Update `src/shell/onboarding/flow.ts` and add `MethodOverviewScreen.tsx` with translations in `es.ts`.
3. Update biting lesson copies in `es.home.ts`.
4. Update unit tests in `world.test.ts`, `homeBehaviours.test.ts`, and `flow.test.ts`.
