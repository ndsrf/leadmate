# Standardize Daily Stage scoring and isolate it from Learning Attributes for leaderboards

Daily Stage ("El Paseo del Día") runs use a deterministic date seed (`YYYY-MM-DD`) for all gameplay-critical elements (pathway, boundaries, distractor schedule) and compute a normalized 0–1,000 handling score from Composure, Slack percentage, Marker accuracy, and Sintonía. Completing a Daily Stage credits the daily Streak and warms up a Rusty Dog, but leaves persistent Learning Attributes and campaign progression untouched so that leaderboard competition and unlimited same-day replays cannot artificially grind or distort the Dog's developmental profile. Terms follow `GLOSSARY.md` (Daily Stage, Streak, Rusty Dog, Learning Attributes, Sintonía, Arousal, Marker).

## Considered Options

- **Allow Daily Stages to mutate Learning Attributes:** would reward grinding high scores by inflating the Dog's learning attributes and make leaderboard replays unrepeatable as the Dog's stats shifted after each run.
- **Vary gameplay distractors per player:** would prevent fair cross-player score comparison on a leaderboard.

## Consequences

Daily Stage replays produce comparable scores across players and across repeated attempts on the same calendar day. Leaderboard submission only needs the payload's composite score, date, and seed.

## As delivered

- The date seed (FNV-1a of the `YYYY-MM-DD` string) fixes the corridor, boundary walls, building blocks, Distractor schedule (kinds, speeds, spawn times, crossing paths) and the visual shields, and it is also the simulation seed, so a replay on the same day starts from the same Stage and the same Dog randomness. Decorative scenery comes from the same seed too, so it does not vary either.
- The score is `round(Composure + Slack + Marker + Sintonía)`: Composure `(100 − peak Arousal score) / 100 × 400`, Slack `slackPercentage / 100 × 300`, Marker `× 200` falling linearly from the average Marker accuracy 0 ms to 1100 ms (the end of the Reward Window) — a Stage with no encounter to time gets the full 200, one with encounters but no hit gets none — and Sintonía `× 100`, full at 40% of the Stage duration. The weights live in `SCORE_WEIGHTS` in `src/sim/payload.ts`, and the score is in every debrief payload as `handlingScore`.
- The record keeps the best score per local date (`DogRecord.dailyBest`); a finished Daily Stage also leaves `lastStageDate` alone, so it never makes a Dog less Rusty by itself: it clears the Rusty Dog capacity penalty for the session only.
