# Proposal

## Why

A new user's first minutes are the conversion. Today the splash hands every new user straight to Dog setup, and the funnel asks four screens of questions (Equipment, weights, Trigger Profile, then a tap test) before any play, and puts the paywall before the first Stage. The user pays attention to nothing they have felt yet. Leading with the problem the product solves (the Dog reacts and the Handler cannot cope) gives every later question a reason to exist.

## What Changes

- The splash is input-free while it loads. For a new user it then stays up as the **welcome screen**: its loader is replaced by one primary button and a small login link, on the same screen.
- A **name and look** step asks for the Dog's name and coat before anything else. The coat choice moves here from Dog setup. The name is new data and is kept in the Dog record.
- A **taste Stage** runs the real simulation on a purpose-built scenario: a strong trigger (another Dog with its owner) with an unskilled Dog, tuned so nobody holds it. It zooms in on the Handler and the Dog a moment after the Dog goes Reactive and ends with the payoff over it. It is not a Stage for learning: its result is discarded and the Dog record is not changed.
- A **payoff** shows over the taste Stage after a short zoom on the Handler and the Dog, naming the Dog and framing what comes next ("let's tune the game to Luna"), then Dog setup, the Diagnostic, the diagnostic card and Walk Plan run as before.
- The guided first Stage becomes a complete introductory learning loop ("Node 0"):
  - **Theory Primer cards** teach the core real-world principle (the slack leash "smile" and threshold management) and game mechanics (movement controls, green/yellow/red leash tension, stopping to anchor/Poste, and marking check-ins).
  - A **Checkpoint question** checks the core technique (stop and act as an anchor when tension spikes).
  - A **guided first walk simulation** lets the user apply this knowledge with supportive event hints.
  - A **Debrief** provides handling feedback and celebrates the successful first walk before registration and the paywall.
- The **soft paywall moves after the first Stage** (its debrief) and the registration prompt, so the user is asked to pay only after experiencing the full pedagogical cycle and playing the game with intent. A later, contextual paywall trigger is left to a follow-up change.
- The persisted step order remains `welcome, dog, taste, setup, diagnostic, plan, first-stage, paywall, done`, with `first-stage` running the introductory node sequence (`primer, checkpoint, simulation, debrief`). The registration prompt follows the first Stage debrief and precedes the paywall, and auth reached from the Funnel returns to the paywall.
- The welcome screen has a secondary "I already have an account" link to login, so returning users skip the new screens.
- Users already part-way through the old funnel skip the new screens and resume where they were.

## Capabilities

### New Capabilities
<!-- None: the new screens extend the first-run funnel that onboarding-funnel already owns. -->

### Modified Capabilities
- `onboarding-funnel`: new first steps (welcome, Dog name and look, taste Stage with its payoff), a new funnel order, the paywall's position, resume and reset behaviour for the new steps.
- `account-sync`: the Dog's name is kept locally and replicated with the Dog record.

## Impact

- `src/shell/onboarding/flow.ts` (steps and routing), `dogRecord.ts` (name field, record version and migration), a new taste scenario config for the simulation, new welcome, name and payoff screens, `SetupScreen` (coat moves out), `PaywallScreen` (position), the i18n catalog, and the account-sync record schema.
- No change to the simulation's code, the learning model or the Diagnostic: the taste uses an existing Stage config and a default snapshot (ADR 0002, 0003).
- Depends on `app-shell-navigation`: this change modifies the same `onboarding-funnel` requirements. Archive that change first, because the deltas here build on its wording.
- Out of scope: the contextual paywall trigger or any entitlement check, a free week, per-step analytics, new Plus copy, and the Paper Meadow restyle itself (the new screens use its components).
