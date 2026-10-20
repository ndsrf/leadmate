# Stars are derived, kept at their best, and merged by maximum

A Node's Stars (1 to 3, from the handling score: 1 for completing it, 2 from 650, 3 from 850 out of 1000) are stored per Node on the Dog record as the best ever earned. A worse replay never lowers them. When two copies of a Dog sync (ADR 0006), the later `updatedAt` still wins the record as a whole, but `stars` is then combined per Node by taking the larger value, the same way completed Nodes are a union and Daily Stage scores are the best per date, so a stale device can never lower a Star and a better replay on either device wins. A Node completed before Stars existed shows 1 Star until it is replayed; the record version was raised to 4 and an older record reads with an empty `stars` map. Stars come from handling quality only: they never change Learning Attributes or the Trigger Profile and never gate a Node or World. Terms follow `GLOSSARY.md`.

There is deliberately no reset path. If a correction is ever needed (a threshold change that should lower old ratings, or a bug that granted too many), it needs a record version bump with a migration that rewrites `stars`, because a plain sync would restore the old maximum from any device that still holds it.

## Considered options

- **Last-write-wins for stars with the rest of the record:** a stale device with a lower rating, or a worse replay on the device that synced last, would take Stars away. That contradicts "never lowered" and punishes replaying.
- **Store only the last run's stars:** a replay that goes worse would erase the user's best, and replaying to practise would feel risky.
- **Recompute stars from stored scores:** only the Daily Stage keeps scores today; Node scores are not stored, and storing them would put telemetry in the synced record for no other use.

## Consequences

Thresholds live beside `SCORE_WEIGHTS` and can be tuned, but retuning does not touch ratings already earned (see above). The sync merge must keep `stars` in its union-style group. Because ratings only ever grow, a Star can be stale-high after a threshold is raised; this is accepted over taking something away from the user.
