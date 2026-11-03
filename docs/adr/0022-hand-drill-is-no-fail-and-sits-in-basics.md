---
status: proposed
---
# The Hand Drill is no-fail and sits in Basics, not in the biting Stretches

World 1 needed a playable close-view exercise in its first minutes, and puppy mouthing is the obvious subject. The signed-off biting review (`fd8c79c`) decided that a simulation that can be failed is the wrong way to teach bite handling, so the biting Home Stretches keep a Lesson and a Mission and no exercise. We add the Hand Drill (a hand offered to the Dog, kept out of reach with Gather, Poste and the Marker) as a Basics Node for every Dog, make it impossible to fail, and let the biting Lessons and Missions only point to it as practice for calm around hands.

## Considered Options

- **A bite exercise inside the biting Home Stretches:** matches the source videos but reverses the signed-off review, reaches only Dogs with a biting Concern, and puts a failable simulation next to bite handling. Rejected.
- **The existing World 4 leash drill moved to World 1:** keeps the safety rule but teaches nothing about hands and keeps a fail state (`success = tier !== 'reactive'`). Rejected.
- **A no-fail Hand Drill in Basics (chosen):** a lunge lowers the score and never ends the run, there is no correction or leash lift, a 60 s cap ends a slow run in a neutral Debrief, and reaching the Debrief or skipping always completes the Node with at least the 1-star credit of ADR 0021.

## Consequences

The close view has two result rules: the World 4 pass can still fail, the Hand Drill cannot. `REQUIRED_PARTS` for the biting behaviours is unchanged, so a missing biting Node is still not a content gap. The Hand Drill is an exception to "a Node needs every Lesson of its Stretch": it needs only the how-to-play Lesson, so its Primer must teach the Dog-as-a-dog frame itself. Guarding ("drop it") and handling segments from the source videos stay out until they get their own professional-help review.
