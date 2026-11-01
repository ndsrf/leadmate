## Why

After the user enters the Dog's name and look, the app drops them straight into the taste Stage: a simulator with another dog walking at theirs. Nothing says what the simulator is, what they control, or that the goal is to keep the Dog from reacting, so the first seconds are confusing and many users flail or just watch.

## What Changes

- Add a short briefing screen between the Dog's name and look and the taste Stage. It says, in plain words, what is about to happen: you walk {name}, another dog will approach, and your goal is to keep {name} calm by dragging {name} away from it. It does not mention the Marker, which does nothing in the taste.
- The taste Stage starts only when the user presses the briefing's button, so the Stage's 20-second limit does not run while the user is reading.
- System back on the briefing is consumed, like the payoff.
- The briefing is text only, shown every time the taste is entered, and it does not promise success: the taste stays built to fail (ADR 0010) and the payoff reframes the result.
- No change to the taste Stage itself, its payoff, the Dog record or the persisted onboarding steps.

## Capabilities

### New Capabilities

### Modified Capabilities
- `onboarding-funnel`: the funnel order and the taste Stage gain a briefing screen shown before the Stage starts.
- `app-shell`: system back on the taste briefing is consumed.

## Impact

- `App.tsx` (taste route: hold the Stage start until the briefing is dismissed), `src/shell/screens/IntroScreens.tsx` (new briefing screen), `src/shell/navigation.ts` (back decision) and its test, `src/i18n/es.ts` (new strings).
- No data model, storage or persisted-step change; reopening during the briefing shows it again, as for the taste Stage.
