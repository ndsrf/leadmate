# Walk feedback follows the trail and is presentation only

A walking Stage answers only its Introduced actions: a fixed starting set (leash tension and the Marker) plus the kinds Introduced by Nodes at or before it on the trail, declared in content through `introduces` on `node.yaml`. The Taste Stage and the guided first Stage use the starting set only, and the Daily Stage, which has no place on the trail, adds what the player's completed Nodes Introduce. The gate hides Feedback Messages, their Hints, Coach marks, the Debrief timeline entries and the Go Sniff offer, but never touches the simulation: payloads, Stage Meter values, the handling score and Stars stay byte-identical whatever is Introduced (ADR 0002). Early walks were crowded with feedback the trail had not yet taught (for example "Nice turn!" long before the Unpredictable walks Lesson), and this keeps each walk focused while adding new feedback and points with the Node that teaches them. Terms follow `GLOSSARY.md`.

## Considered Options

- **Lessons Introduce, once read:** follows the player's own reading, but a replayed early Node would differ between players, and content validation could not check it.
- **A per-Node allowlist:** the most explicit, but the most authoring work, and a forgotten kind silently disappears.
- **Filtering in the simulation:** would also stop an untaught action from scoring, but changes payloads and meters and breaks the seeded-replay guarantee.

## Consequences

An action the trail has not yet Introduced can still happen and still count in the sim; the player simply is not told. A new action kind must be added to the starting set or to one Node's `introduces`, or content validation warns and the format-guide test fails. The Go Sniff button keeps the sim's own World check as well, so the two rules must agree on the trail. Stable shows fewer messages until the `introduces` lists are promoted.
