# Proposal

## Why

Currently, declaring home concerns (biting, barking, destruction, eating objects) injects up to five additional stretches into World 1, ballooning it to as many as eight stretches and creating an overwhelming progression bottleneck before owners ever reach the rest of the curriculum. Additionally, new owners enter the World Map without understanding the core pedagogical loop (Theory → Simulation → Real-World Mission) or recurring features like Guaudoku and the Daily Walk, and biting theory lacks actionable early prevention (the canine escalation ladder and trade-up protocols).

## What Changes

- **Move Home Concerns to World 2**: World 1 remains a fixed, universal 3-stretch foundation ("Los cimientos del paseo") for every dog. Declared Home Stretches move into World 2 ("Casa y umbrales / Convivencia en casa"), appearing first according to the personal plan, followed by threshold rituals (Harness, Doorbell, Poste).
- **Keep Worlds 1 & 2 Free**: Both World 1 and World 2 remain 100% free-tier so users can address their dog's declared home behavioral issues without subscription barriers.
- **Onboarding Method & Ecosystem Overview**: Introduce an onboarding overview screen after the Personal Plan explaining the app's training format (the 3-step loop: Theory lesson → Simulation node → Real-world mission) along with recurring modalities (Barkdoku spatial deduction puzzle and Daily Walk streak).
- **Personalized Plan Reassurance Note**: Display a clear note in the onboarding flow confirming that the user's declared concerns are prioritized in World 2, explaining that World 1 provides the 3 essential calm and communication foundations needed for learning.
- **Actionable Biting & Home Concern Prevention Theory**: Expand biting theory lessons to emphasize early prevention (the canine ladder of aggression / stress traffic light, environmental management) and immediate tactical protocols (the trade-up / "intercambio" game and reverse timeouts), laying the pedagogical groundwork for future close-view interactive exercises.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `dog-basics-world`: Restores World 1 to strictly contain the three universal foundational stretches without interleaving dynamic home concern stretches.
- `home-behaviour-training`: Relocates declared Home Stretches into World 2 (ahead of threshold stretches) instead of World 1, updates undeclared home behaviour placement, and enriches biting theory with actionable early prevention and trade-up protocols.
- `world-progression`: Updates World 1 and World 2 progression definitions: World 1 is a compact 3-stretch foundation; World 2 incorporates the dog's declared home behavioral stretches; both remain free-tier.
- `onboarding-funnel`: Adds the training format and ecosystem overview step (3-step loop, Guaudoku, Daily Walk) and the personalized plan reassurance note before entering the World Map.

## Impact

- Code: `src/shell/world.ts`, `src/shell/homeBehaviours.ts`, `src/shell/onboarding/flow.ts`, `src/shell/screens/PlanScreen.tsx` or new onboarding screen `src/shell/screens/MethodOverviewScreen.tsx`, `src/shell/screens/WorldMapScreen.tsx`, and lesson catalogs in `src/i18n/`.
- Tests: Updates to `world.test.ts`, `homeBehaviours.test.ts`, `flow.test.ts`, and map progression tests.
- ADR: Supersedes ADR 0021's placement of home stretches in World 1 by moving them to World 2.
