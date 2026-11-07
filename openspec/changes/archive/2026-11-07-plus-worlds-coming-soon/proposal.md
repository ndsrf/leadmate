# Proposal

## Why

Worlds 6–9 (Park recall, Café, Trails, Crowds) are Plus roadmap previews with no Stops yet. Their teaser card always says "Unlock the whole map with LeadMate Plus" and offers the paywall button, even to a user who already has Plus (trial or subscription). The user has paid, or is trialling, and is told to buy. There is also nothing to see after the last playable World, so a Plus user who finishes early hits a dead end with no sign of what is coming.

## What Changes

- The Coming-soon World card (Worlds 6–9) becomes membership-aware:
  - **Free user**: unchanged. Plus teaser and paywall button.
  - **Plus user (trial or subscribed)**: a "Coming soon" card with a short description of what the World will teach, its planned walk count and a note that it opens for them automatically when it ships. No paywall wording and no paywall button.
- Add a More-coming card after the last World on the map, with a list of upcoming training scenarios. Free users see the Plus disclaimer and paywall button on it; Plus users see only the list.
- Add Spanish copy for each Coming-soon World's "what you'll learn" blurb and for the end-card scenarios.
- Coming-soon Worlds still do not count towards "all complete" and still have no executable Stops.
- Out of scope: shortening the trial from 7 to 3 days (a separate decision about `TRIAL_DAYS` in `plus.ts`, its copy and billing setup); writing the content of Worlds 6–9; a notify-me or waitlist mechanism.

## Capabilities

### New Capabilities

### Modified Capabilities
- `world-map-screen`: Coming-soon World card depends on membership; new end-of-map "More coming" card.

## Impact

- `src/shell/screens/WorldMapScreen.tsx`: preview card branch (~line 896) and a new end card after the Worlds list.
- `src/shell/mapModel.ts` / `world.ts`: no model change expected; `tier` and `preview` already exposed.
- `src/i18n/es.ts`: new keys per Coming-soon World and for the end card; existing `map.plusTeaser*` keys stay for free users.
- Tests: `WorldMapScreen.test.tsx`, plus an i18n catalog-usage check.
- No content-pack schema change: blurbs live in the i18n catalog, like World topics.
