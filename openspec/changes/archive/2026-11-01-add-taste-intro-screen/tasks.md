## 1. Copy and screen

- [x] 1.1 Add `tasteBrief.*` strings (title, goal line, drag line, button; no Marker mention) to `src/i18n/es.ts`; check `catalog-usage.test.ts` passes
- [x] 1.2 Add `TasteBriefScreen` to `src/shell/screens/IntroScreens.tsx` (Dog name via `withDogName`, one primary button)

## 2. Wiring

- [x] 2.1 In `App.tsx` add `tasteBriefed` state, reset on entering the `taste` route, and start the taste Stage only once it is true
- [x] 2.2 Render `TasteBriefScreen` for the `taste` route while not briefed; its button sets `tasteBriefed`
- [x] 2.3 Add a `briefing` input to `backAction` in `src/shell/navigation.ts` that returns `consume`, and pass it from `App.tsx`

## 3. Tests and verification

- [x] 3.1 Add a `backAction` test for the briefing in `src/shell/navigation.test.ts`
- [x] 3.2 Run the test suite and typecheck
- [x] 3.3 Manually run the onboarding: name and look → briefing → Stage starts only after the button → payoff; kill the app on the briefing and confirm it reappears
