---
status: accepted
---
# Satellite Stops for life-stage tracks

Puppies have acute, time-critical learning needs (mouthing and needle-teeth redirection, domestic sound habituation, and calm veterinary touch acclimation) that arise during the developmental window under six months of age. Introducing a separate "World 0" would block or delay the core walking simulator mechanics, while inserting these topics linearly into the World 1 trail would lengthen the universal spine by days and force adult or senior dog owners through irrelevant material.

Dedicated life-stage modules for puppies are anchored directly alongside the three foundational Stretches of World 1 ("Un perro es un perro") as non-gating Satellite Stops on the World Map. For Dogs whose `ageBand` is `puppy`, compact satellite stop nodes appear anchored beside Stretch 1 (mouthing redirection), Stretch 2 (domestic sound desensitisation), and Stretch 3 (veterinary handling). Satellite Stops never gate Missions, Day Skips, or the completion and unlocking of World 2. Dogs without the `puppy` age band do not render satellite stops, and all users can reference the lessons at any time in the Theory Library.

## Considered Options

- **Linear insertion into World 1 trail:** Lengthens World 1 by three additional days/missions, cluttering the foundation and slowing progression toward outdoor walks.
- **Dedicated gating "World 0":** Delays access to the core leash-handling simulator and frustrates owners seeking help with walking and leash connection.
- **Dual-column branching tree layout:** Breaks LeadMate's signature single winding trail metaphor and creates layout whiplash when advancing to World 2.
- **Non-gating Satellite Stops anchored beside World 1 Stretches (chosen):** Keeps World 1 a concise 3-Stretch foundation, provides immediate one-tap access to acute puppy solutions, and avoids gating trail advancement.

## Consequences

- When `ageBand === 'puppy'`, World 1 renders three Satellite Stops anchored alongside each Stretch's opening Stop (placed on the side opposite the text label to preserve spacing and prevent badge overlap), connected by subtle dashed connectors.
- Satellite Stops are non-gating: completing World 1 and unlocking World 2 depends solely on passing the 3 spine Missions.
- Satellite module completions are tracked as standard `Lesson` IDs in `DogRecord.readLessons`, ensuring they persist across age transitions and remain accessible in the Theory Library.
- Non-puppy records retain the clean, unaltered linear World 1 trail.
