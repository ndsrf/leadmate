# Proposal

## Why

Free users who bypass the trial during onboarding have almost no reason or opportunity to discover LeadMate Plus, while users inside the trial see virtually no tangible difference or feedback reflecting their status. Gating video demonstrations and giving the trial explicit visual identity and life-cycle feedback turns the trial into a distinct, high-value experience that motivates conversion to full membership.

## What Changes

- **Map Header Plus Chip**: Add a persistent `PlusChip` to the World Map header that reflects user lifecycle:
  - *Free (No trial)*: Displays a trial offer (`7 días gratis`), opening the bypassable conversion paywall.
  - *Trial active*: Displays remaining trial days (`Plus · X d`), opening an active membership sheet recapping unlocked benefits.
  - *Trial expired*: Displays an upgrade call-to-action (`Pasar a Plus`), opening the conversion offer.
- **Theory Lesson Video Gating**: Video demonstration blocks in Theory Lessons become a LeadMate Plus benefit:
  - Free users see the video thumbnail with a locked preview card and a *"Desbloquear con 7 días gratis"* button that opens the paywall while holding the pending play action. Users can bypass it and continue reading all text, tips, and illustrations.
  - Active trial and Plus users enjoy seamless inline video playback accompanied by a *"Desbloqueado con Plus"* badge.
- **Trial-to-Full Conversion & Value Recap**:
  - Upon first launch after the 7-day trial expires, a Value Recap screen highlights what the user and their Dog accomplished during the trial (videos watched, day skips used, active streak days) and offers full subscription plans with a clear bypass to stay on the free tier.
  - Tapping a locked Plus feature or the expired map chip routes to the full conversion screen.

## Capabilities

### Modified Capabilities
- `plus-membership`: Defines trial lifecycle states (unstarted, active with countdown, expired), the trial-to-full conversion contract, and the Value Recap requirements.
- `world-map-screen`: Adds the `PlusChip` to the Map Header across lifecycle states and the active trial status modal.
- `theory-lessons`: Adds Plus gating on video demonstration blocks with locked preview and seamless unlock upon starting a trial.

## Impact

- `src/shell/plus.ts`: Helpers for trial days remaining (`trialDaysRemaining`), trial expired check, and pending video unlock actions.
- `src/shell/screens/WorldMapScreen.tsx`: Header chip row inclusion of `PlusChip` and trial status modal presentation.
- `src/shell/ui/LessonVideoCard.tsx`, `src/shell/screens/LessonScreens.tsx`: Gated video view state, lock overlay, and unlock trigger.
- `src/shell/screens/PaywallScreen.tsx` & new `ValueRecapScreen.tsx`: Expiration recap and full conversion options.
- `src/i18n/es.ts`: Text keys for the header chip, video lock messages, trial status modal, and value recap copy.
