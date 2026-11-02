# Ask the Main Concern before the Taste Stage

ADR 0010 put the Taste Stage ahead of every setup question, so the user feels the problem before being asked about it. That left the taste identical for everyone: an owner whose real problem is biting at home was shown a dog walking at the Dog first. We now ask exactly one question, the Main Concerns (up to three picks, most worrying first), between the Dog's name and look and the Taste Stage. The first outdoor pick chooses the kind of Distractor the Taste Stage uses and the wording of the Payoff Screen. Every other question stays after the taste.

## Considered options

- **Keep the taste identical and only personalise the plan afterwards:** keeps ADR 0010 untouched, but the first thing a biting-first owner plays still feels unrelated to their problem. Rejected as the reason for this change.
- **A separate at-home taste for Home Behaviours:** matches the problem more closely, but it would not be a Stage, would have no Reactive outcome, and would break the Taste Stage's definition and the Payoff Screen. Rejected; the Taste Stage stays a leash Stage and Home Behaviours are handled by the Personal Plan.
- **Ask all Concern questions first:** best data, but it brings back the four screens of questions with no hook that ADR 0010 rejected.

## Consequences

ADR 0010 still holds for everything except the order: the Taste Stage is built to fail and its result is discarded. The funnel gains one step (`concern`) and a user with no Main Concern, including every existing user, gets the approaching-dog taste as before. The one question must stay a single screen of taps (three at most); more questions before the taste would need a new ADR.
