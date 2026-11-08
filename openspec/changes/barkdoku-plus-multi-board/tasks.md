# Tasks

## 1. Board Generation & Escalating Size Progression

- [x] 1.1 Extend `getDailyBoard` in `src/shell/puzzle/boards.ts` to accept an optional `boardIndex: number = 0`, generating fresh unique boards cycling sizes 5x5, 6x6, 7x7, 8x8 via `generateBoard` for indices > 0 while preserving the curated index 0 board, and verify with unit tests in `src/shell/puzzle/boards.test.ts`.

## 2. Localization & Tier Copy

- [x] 2.1 Add localization strings to `src/i18n/es.ts` for Barkdoku tier indicators (Plus, Prueba Plus, Práctica · Tablero diario), upfront subtitle for free tier, same-day same-board notice on SolvedCard, new board perks for trial/subscribed users, "Jugar otro tablero" and "Desbloquear con Plus" buttons, and trial modal perk listing. Verify catalog integrity via `npm test -- -t "i18n"`.

## 3. Barkdoku UI Context & SolvedCard Actions

- [x] 3.1 Update `BarkdokuView` in `src/shell/screens/BarkdokuView.tsx` to accept `tier`, `boardIndex`, `onNewBoard`, and `onUpgrade` props, rendering tier badges in the header, upfront same-board warning caption for free tier practice, and contextual notices with action buttons in `SolvedCard`.
- [x] 3.2 Update `BarkdokuView.test.tsx` to assert that trial users see the `Prueba Plus` badge, trial notice and "Jugar otro tablero" button, subscribed users see the Plus notice and "Jugar otro tablero" button, and free users see the upfront practice header notice and "Desbloquear con Plus" button on completion. Verify with `npm test -- src/shell/screens/BarkdokuView.test.tsx`.

## 4. Shell Integration, Activity Log & Flow Routing

- [x] 4.1 Update `PendingPlusAction` in `src/shell/plus.ts` to support `{ kind: 'barkdoku' }` and add unit tests in `src/shell/plus.test.ts` verifying pending Barkdoku unlocks.
- [x] 4.2 Add `recordPlusBarkdoku` helper in `src/shell/dogRecord.ts` to append Plus Board solves to `DogRecord.activityLog` without modifying `dailyBarkdoku[date]` or double-crediting Streak, and verify with unit tests in `src/shell/dogRecord.test.ts`.
- [x] 4.3 Update `Flow` in `App.tsx` so `{ name: 'puzzle' }` supports `boardIndex?: number`, derive default `boardIndex` from today's Barkdoku entries in `DogRecord.activityLog`, wire `tier`, `onNewBoard`, and `onUpgrade` callbacks in `App.tsx`, and ensure paywall resolution returns to a fresh board (`boardIndex = 1`).
- [x] 4.4 Add integration tests in `src/App.test.tsx` covering Barkdoku entry, multi-board advancement for Plus/trial users, and paywall trigger for free users. Verify with `npm test -- src/App.test.tsx`.

## 5. Trial Perks & Paywall Surface

- [x] 5.1 Add Barkdoku multi-board perk item to `TrialModal` in `src/shell/screens/WorldMapScreen.tsx` and verify trial modal rendering in `src/shell/screens/WorldMapScreen.test.tsx`.
- [x] 5.2 Run complete test suite via `npm test` to ensure zero regressions across all Barkdoku, streak, and subscription flows.
