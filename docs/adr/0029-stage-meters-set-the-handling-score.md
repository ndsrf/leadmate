# Stages with Stage Meters take their handling score from the meters

A Stage whose scenario declares Stage Meters computes its handling score as 1000 times the mean fill of its meters (each meter's Meter Points over its target). Every other Stage, and the Daily Stage, keeps the ADR 0005 formula (Composure, Slack, Marker accuracy, Sintonía). We did this because World 6's Unpredictable Walk and sniffing Stages reward things that formula cannot see, such as granting sniffs, waiting out a Plant, fresh moves and Chains. Players also see Meter Points fly into the meters during play, so the Stars must come from the same numbers or the result looks arbitrary.

## Considered Options

- **Add meter terms to the ADR 0005 formula for every Stage:** this would change Daily Stage scores mid-leaderboard and re-weight Stars on Worlds 3-5 that players already earned.
- **Keep ADR 0005 for World 6 too and show meters for feel only:** the Stars would disagree with what the player watched fill up, and Slack and Composure would punish a Handler for letting the Dog plant at a Scent Spot.

## Consequences

There are two scoring rules. The rule is chosen only by whether the scenario declares meters, and the Debrief payload carries `meters` only when it does. Stars earned on `park-unpredictable` under its old provisional scoring are kept, because Stars merge by maximum (ADR 0007).
