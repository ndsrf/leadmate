# Proposal

## Why

Currently, Daily Barkdoku pins users to a single board per calendar day. Free users replaying that day only repeat the exact same board in practice mode, and Plus members (including those on a 7-day trial) have no way to exercise their deduction skills on fresh boards on the same day. Allowing Plus users to play different boards multiple times per day rewards subscribers, highlights trial value, and offers a compelling reason for free users to upgrade.

## What Changes

- **Plus Boards for Plus Members**: Users with active LeadMate Plus (both active store/mock subscribers and users in their 7-day trial) can play multiple, distinct Barkdoku boards each day, formally defined as **Plus Boards** (*Tableros Plus*) in `GLOSSARY.md`.
- **Diary & Activity Log Recording**: Solves of additional Plus Boards are logged in the `Activity Log` with their Solve Time, mistakes, and Stars earned, appearing in the user's Diary as legitimate cognitive achievements without altering the benchmark `Daily Solve Time` or double-crediting the Streak (ADR 0027 amending ADR 0014).
- **Trial & Plus Perception**: Plus and trial users are explicitly informed in the puzzle interface (via a `Prueba Plus` or `Plus` header badge and victory card) that playing subsequent fresh boards is available because they have LeadMate Plus (or an active trial).
- **Free Tier Upfront Awareness & Upgrade Path**: Free users replaying the daily board are clearly informed upfront (via a `Práctica · Tablero diario` header badge and caption) and on completion that they see and practice the same daily board until tomorrow, with an actionable prompt to start a 7-day trial or upgrade to Plus to unlock unlimited new boards immediately.
- **Instant Gratification on Conversion**: Upgrading from the Barkdoku paywall prompt resolves via `PendingPlusAction` by immediately dealing a fresh board (`boardIndex = 1`).
- **Streak & First Solve Integrity**: The first solve of the day continues to count for the Streak and sets the recorded Daily Solve Time, preserving ADR 0014 rules.
- **Plus Perks & Paywall Updates**: Mentions of multi-board Barkdoku puzzles added to trial perks (`trialModal`) and paywall value messaging.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `barkdoku-puzzle`: Add multi-board progression for Plus and trial members on the same calendar day, log Plus Boards to the Activity Log, display tier-specific messaging in the puzzle interface, and provide an upgrade path for free users.
- `plus-membership`: Add multi-board Barkdoku puzzles to the documented LeadMate Plus feature bundle and trial perk presentation.

## Impact

- **UI / Screens**:
  - `BarkdokuView.tsx`: Add tier badges (`Plus` / `Prueba Plus` / `Práctica · Tablero diario`), upfront same-board note for free users, action buttons to proceed to a new board for Plus users, and clear messaging/upgrade button for free users on the SolvedCard.
  - `App.tsx`: Route puzzle flows supporting distinct boards for Plus replays by deriving `boardIndex` dynamically from today's Barkdoku entries in `DogRecord.activityLog`.
  - `WorldMapScreen.tsx`: Reflect board status or perk hints where appropriate.
  - `PaywallScreen.tsx` / `trialModal`: Add Barkdoku multi-board perk copy.
- **Logic & Content**:
  - `src/shell/puzzle/boards.ts`: Provide deterministic sequence or generated boards for multiple daily plays cycling `5x5 → 6x6 → 7x7 → 8x8`.
  - `src/shell/plus.ts`: Support Barkdoku multi-board perk checks and pending actions (`{ kind: 'barkdoku' }`).
  - Localization files (`src/i18n/es.ts`): New strings for Plus board perks, trial notices, and free tier limitations.
  - Domain documents: `GLOSSARY.md` (Plus Board) and `docs/adr/0027-plus-barkdoku-boards-and-diary-logging.md`.
