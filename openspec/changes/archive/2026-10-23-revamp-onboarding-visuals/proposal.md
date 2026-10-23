# Proposal

## Why

The onboarding screens still look like plain forms: the Dog's look is a row of text-only coat buttons, the Trigger Profile questionnaire is a wall of 4-button rows (5 kinds x 4 answers), the Diagnostic is a bare "tap when green" pad, and the soft paywall is a title, a sentence and two buttons. The design canvas (board "10 - Onboarding funnel" and "04b - Breed system") shows the same funnel in the paper-meadow style: a breed picker with drawn silhouettes, chip-based trigger selection, a Diagnostic played against the Dog itself, and a paywall with Migas, a "7 days free" pill and a benefit list. The funnel is the first thing a new user sees, so it should look as good as the rest of the revamped app.

## What Changes

- **Dog step: breed picker.** The Dog's name-and-look screen gains a breed grid of drawn silhouette tiles (launch set of 16 breeds, plus "Mestizo" and "Otra raza"), a stepper header ("1 of 3"), and a live preview of the Dog in the chosen breed and coat. The coat choice becomes colour swatches (colour plus visible name) instead of text-only buttons. The breed is stored in the Dog record and pre-fills a typical weight and a default coat, both still editable.
- **Setup: weight and equipment.** Dog weight and Handler weight become sliders with a value bubble and a breed weight-range hint (typing remains possible for accessibility); Equipment becomes two illustrated cards (collar, Y-harness) with a check on the selected one.
- **Setup: trigger picker.** The per-kind four-answer rows become chips ("what makes {name} react?"): selecting a chip marks the kind as a trigger and reveals a three-step intensity control; unselected kinds stay at level 0. Same Trigger Profile data, same supported kinds.
- **Diagnostic minigame.** The 15-second Diagnostic is redrawn as a scene: the Dog on a meadow, a paw-progress row, a coach caption, and a round Marker button. The signal is the Dog turning to look at the user (ears up, fixed gaze) instead of a pad turning green. Timing, latency and seeding rules do not change.
- **Soft paywall.** The paywall gets the paper-meadow treatment: close button, Migas, a "7 days free" pill, three benefit rows with icons, a reassurance panel that basics stay free, and the two buttons. Still a stub: no gating, no entitlement check, no real price.
- **Steps stay in the current order** (welcome, dog, taste, setup, diagnostic, plan, first-stage, paywall). The design canvas groups breed, weight, coat and name on consecutive screens; we keep the shipped play-first order and only add a step counter inside each group.

## Capabilities

### New Capabilities
- `dog-breed`: the Dog's breed (id list, size band, typical weight range, default coat), its silhouette art, and how it pre-fills weight and coat.

### Modified Capabilities
- `onboarding-funnel`: the Dog name-and-look, Dog setup (weights, Equipment, Trigger Profile questionnaire), Diagnostic and soft-paywall requirements change in presentation and, for breed and trigger selection, in interaction.
- `canine-minigames`: the Diagnostic becomes a scene-based Minigame with Dog cue, paw progress and a Marker button; the cue-driven timing rule extends to it.

## Impact

- **Code:** `src/shell/screens/IntroScreens.tsx` (DogLookScreen), `SetupScreen.tsx`, `DiagnosticView.tsx`, `PaywallScreen.tsx`; new onboarding UI pieces under `src/shell/ui/` (breed art, swatches, slider, chip, stepper header); new `src/shell/onboarding/breeds.ts`; `src/shell/onboarding/{setup,questionnaire,diagnostic}.ts` for the new interaction; `src/shell/dogRecord.ts` (adds `breed`, record version migration); `src/i18n/*` strings.
- **Data:** `DogRecord` gains `breed` (default `mestizo` for existing records); the record sync payload gains the field (see `account-sync`, design notes).
- **No change:** the simulation, Stage sprites, Trigger Profile levels and `pullStrength` formula, funnel step order and persistence, paywall behaviour.
- **Out of scope:** breed-specific Stage sprites in the Phaser bundle (breed is drawn in the shell only, the Stage keeps coat and size), the design's extra trigger kinds the simulation does not support, the "how much does it pull" and "how long to calm" questions (no data model behind them), real billing and prices, other minigames (Poste and Doorbell already use the scene components).
