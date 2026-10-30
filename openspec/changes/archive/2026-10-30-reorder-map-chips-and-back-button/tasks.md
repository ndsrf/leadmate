# Tasks

## 1. World Map header

- [x] 1.1 In `src/shell/screens/WorldMapScreen.tsx`, replace the two header rows with a single wrapping row ordered Streak, Library, gear `IconChip`, Daily, Barkdoku, and delete the "Diario" `Chip`. Verify the map renders with no layout clipping at phone width.
- [x] 1.2 Update `src/shell/screens/WorldMapScreen.test.tsx`: assert the header entries' order (Streak → Library → gear → Daily → Guaudoku), assert no pressable is labelled `es['diary.chip']` except the Streak chip (whose label includes it), and keep the gear accessibility test. Verify with `npx jest src/shell/screens/WorldMapScreen.test.tsx`.

## 2. Back policy

- [x] 2.1 Add `backAction({ route, playingStage, paused, bundle, hasScreenBack, payoff, choosingDog })` to `src/shell/navigation.ts`, returning `'pause' | 'resume' | 'screen' | 'consume' | 'exit'` in the branch order of design.md decision 2. Verify it type-checks with `npx tsc --noEmit`.
- [x] 2.2 Add `navigation.test.ts` cases for each branch: bundle error with a closure → screen, without one → consume; payoff → consume; choosing Dog on the map → consume; running Stage → pause; paused Stage → resume; loading Stage → consume; splash → exit; map → exit; funnel step without screen back → exit; onboarding paywall → exit; flow with screen back → screen; flow without screen back → consume. Verify with `npx jest src/shell/navigation.test.ts`.

## 3. Wire system back in the shell

- [x] 3.1 In `App.tsx`, add a `screenBack` ref that is reset each render and a helper that registers a closure and returns it. Use it on every screen branch so the on-screen back and system back share one closure: Diary, Library, Lesson, Mission (brief/waiting/checkin/fix → close, problem → checkin, passed → goHome), Settings close, Auth `onAuthDone`, Paywall `onLater`, Register "not now", Daily result, Node primer exit, Node Debrief → its `onDone`, Barkdoku (Node and Daily) `onExit`, first-stage Primer `onExit`, and Node/Daily/warm-up Stages → goHome. Leave unregistered: the Checkpoint (Node and first-stage), the first-stage Debrief, and the Doorbell/ReadDog/Poste Minigames. Pass `payoff` (taste payoff showing) and `choosingDog` (Choose Dog showing) to `backAction`. Verify with `npx tsc --noEmit` and that existing tests still pass (`npm test`).
- [x] 3.2 Register one `BackHandler` `hardwareBackPress` listener that reads refs for route/paused/bundle/playingStage, calls `backAction`, and handles each result: `pause` → `send({ type: 'pause' })`, `resume` → the same code as the `ResumeOverlay` `onResume`, `screen` → `screenBack.current()`, `consume` → nothing. Return `false` only for `exit`. Verify by unit-testing the handler's dispatch if it is extracted, otherwise by the manual checks in 4.1.
- [x] 3.3 Confirm that a shell-sent `pause` without a focus change makes the bundle reply `paused` (check the sim message handler in `src/sim`). If it doesn't, set `paused` in the handler directly. Verify that the pause overlay appears in 4.1.

## 4. Integration check

- [x] 4.1 On an Android emulator or device, press system back and confirm: Diary/Library/Settings/Guaudoku → map; Library → Lesson → back → Library → back → map; Mission problem → check-in; Settings → log in → back → Settings; Debrief of a Stretch's last Node → Mission brief; mid Node Stage → Pause Menu, back again → resumes, Exit → map; Daily Stage and warm-up → Pause Menu; Checkpoint and Doorbell Minigame → nothing happens; Choose Dog → nothing happens; map with a lock note showing → app closes on the first press.
- [x] 4.2 Run `npx openspec validate reorder-map-chips-and-back-button --strict` and `npm test`, and confirm both pass.
