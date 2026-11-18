# The Read the Dog Diagnostic reports latency on the old reflex scale

The onboarding Diagnostic is now a round of Read the Dog, where the user picks one of three Signal Classes instead of tapping one Marker button. Choosing takes longer than a pure reflex, so raw answer times would push almost everyone into the slow band. We kept the old scale: each right answer counts as its time minus a fixed decision allowance (0.45 s), clamped to 0-1.5 s, each missed Body Signal counts as 1.5 s like the old time-out, and the latency is the median. The latency bands, `seedFromLatency`, the Personal Plan, the stored `diagnosticLatency` and its exactly-once seeding are unchanged, and values recorded by the old reflex test stay valid.

## Considered Options

- **Re-band on raw classification times and migrate stored values:** the numbers on the card would be literal, but it touches the Dog record, sync and the plan rules, and mixes two scales in records already synced, for no gain a player can see.
- **Subtract the allowance from the median:** simpler, but a round of only misses would report 1.05 s instead of the slow end of the scale.

## Consequences

The diagnostic card's number is the reaction time once the signal was spotted, not the full answer time, so its label says so. The allowance is a tuning constant: changing it shifts the band of new users only, never stored values. Screen reader users' times include speech, a bias the old reflex test shared.
