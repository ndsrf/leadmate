---
status: accepted
supersedes: ADR-0021
---
# Home Stretches relocate to World 2

Home Stretches (biting the owner, biting other people, barking at home, destroying things, eating non-food) were previously placed into World 1 per Dog from its Concerns (ADR 0021). For dogs with multiple concerns, World 1 expanded up to eight Stretches, creating an onboarding progression bottleneck before owners ever unlocked threshold training or outdoor walking.

Declared Home Stretches now join World 2 ("Casa y umbrales"), placed at the beginning of World 2 in Personal Plan order (biting first) before the threshold Stretches (Harness Ritual, Doorbell Mat, Poste practice). World 1 remains a fixed, universal 3-Stretch foundation ("Un perro es un perro") for all dogs. Both World 1 and World 2 remain free-tier. Undeclared Home Stretches sit in the optional "Other Home Behaviours" section immediately after World 2.

## Considered Options

- **Keep declared Home Stretches in World 1 (ADR 0021):** Causes severe drop-off and pacing bottlenecks for dogs with multiple concerns.
- **Create an intermediate "World 1.5":** Shifting world numbering breaks established progress, analytics, and specs.
- **Home Stretches in World 2 ahead of threshold Stretches (chosen):** Keeps home behavioral issues within the home/indoor domain, preserves free-tier access, and leaves World 1 as a lightweight 3-day foundation for every dog.

## Consequences

- World 1 has exactly 3 Stretches for every dog and completes regardless of declared home concerns.
- World 2 contains the dog's declared Home Stretches followed by the 3 threshold Stretches. World 2 completes only when both are done.
- `setHomeConcern` gates on World 2 completion: a concern declared after World 2 completes stays in Other Home Behaviours, preventing backwards progress.
- A started Home Stretch stays in World 2 even if the concern is subsequently removed.
