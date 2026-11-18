# An Encounter Series scores from its best Paws and updates the Dog once

A walking Node can be played as an Encounter Series: 3 to 5 short Encounters, each retried at once with the same seed. Its handling score is 1000 times the sum of each Encounter's best Paws (the latest attempt on a tie) over three times the number of Encounters, so the existing Star thresholds apply unchanged. The Dog is updated once, at the Debrief, from one payload combining those best attempts. Every Encounter and retry starts from the Dog snapshot taken when the Series started. This is a third scoring rule beside ADR 0005 (composite) and ADR 0029 (Stage Meters), chosen only by whether the Node defines a Series. We did this because Paws are what the player sees after each Encounter, so the Stars must agree with them, and because `updateLearning` caps gains per payload: one combined update keeps the per-Node learning rate of the long walk however many retries were played.

## Considered Options

- **ADR 0005 score of the combined payload:** Composure and Sintonía weights make a 15-second Stage's score noisy and blind to its one decision; the Stars would disagree with the Paws.
- **Last attempt counts:** simpler to explain, but punishes a player who retries once more for fun.
- **Update the Dog after every attempt:** a Series could teach the Dog several times faster than the walk it replaces, and retries would inflate the Trigger Profile's calm counts.
- **Score a skipped Series from the Encounters played (unplayed at 0):** rejected for now; a skip follows ADR 0021 (1 Star, no Dog update) unless every Encounter already has an attempt.

## Consequences

Stars earned under Paw scoring are kept by ADR 0007 even if the Series is rolled back to one long Stage. Retuning the Paw rule changes future ratings only. Encounters may not declare Stage Meters, so ADR 0029 and this rule never apply to the same Stage, and the Daily Stage keeps ADR 0005.
