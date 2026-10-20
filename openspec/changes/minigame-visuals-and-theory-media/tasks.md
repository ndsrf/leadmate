# Tasks

## 1. Schema & Data Model Extensions

- [ ] 1.1 Extend `NodeDef` and `NodeRun` in `src/shell/nodes/node.ts` to support structured primer cards (`kind: 'real-world' | 'virtual-dog'`, `text: TextKey`, `media?: NodeMedia`, `tutorialUrl?: string`) while maintaining backward compatibility with plain `TextKey[]`; verify by running `npm test -- src/shell/nodes/node.test.ts`.
- [ ] 1.2 Define `NodeMedia` interface supporting external images and videos, captions, placeholder flags, and web tutorial URLs in `src/shell/nodes/node.ts`; verify type checking with `npx tsc --noEmit`.
- [ ] 1.3 Add unit test coverage in `src/shell/nodes/node.test.ts` for structured primer card parsing, section categorization, and card progression; verify all tests pass.

## 2. Canine Minigame Visual Components

- [ ] 2.1 Implement `CanineMinigameAvatar` in `src/shell/ui/CanineMinigameAvatar.tsx` rendering canine postures (`standing_waiting`, `alert_barking`, `settling_towards_mat`, `calm_sphinx_on_mat`, `straining`, `slack`) based on input state props; verify component renders each posture without errors in isolation.
- [ ] 2.2 Implement unit tests in `src/shell/ui/CanineMinigameAvatar.test.tsx` asserting correct posture and accessibility properties for each canine state; verify tests pass.
- [ ] 2.3 Implement minigame environmental prop renderers (Door prop with animated chime ripple, Mat prop, and dynamic Bezier leash curve) in `src/shell/ui/`; verify unit tests pass.

## 3. Minigame Views Overhaul

- [ ] 3.1 Refactor `DoorbellMatView.tsx` to replace abstract color boxes with Door, Mat, and `CanineMinigameAvatar` components, linking the 4-posture cycle to doorbell phases and triggering agitation on early marks; verify component behaves properly under `npm test`.
- [ ] 3.2 Refactor `PosteMinigameView.tsx` to replace the simple progress bar with the dynamic leash curve and canine strain/settle postures; verify with `npm test`.
- [ ] 3.3 Add unit tests verifying outcome feedback, canine state transitions, and user action handling for both minigame views; verify all tests pass.

## 4. Theory Primer, Placeholders & In-App Tutorial Browser

- [ ] 4.1 Implement `MediaPlaceholder` in `src/shell/ui/MediaPlaceholder.tsx` handling images, video cards, and canine-themed placeholders for offline or pending media; verify component renders properly.
- [ ] 4.2 Implement `InAppBrowserModal` in `src/shell/ui/InAppBrowserModal.tsx` providing a slide-over modal for web-hosted tutorials with offline error handling and close action; verify component renders properly.
- [ ] 4.3 Write unit tests in `src/shell/ui/MediaPlaceholder.test.tsx` and `src/shell/ui/InAppBrowserModal.test.tsx` verifying placeholder rendering, media badges, and in-app browser states; verify tests pass.
- [ ] 4.4 Update `PrimerScreen.tsx` to render category indicators (`Real-World Dog Handling` vs `Virtual Dog Simulation`), media placeholders, and "Open Full Guide" tutorial buttons; verify with `npm test`.

## 5. Content & Localization Updates

- [ ] 5.1 Update Node definitions in `src/shell/nodes/content.ts` for Doorbell Mat, Poste Practice, and Harness Ritual to use structured dual-aspect primer cards, web tutorial placeholders, and real-world Checkpoints; verify with `npm test`.
- [ ] 5.2 Expand localization catalogs in `src/i18n/` (English and Spanish) with comprehensive real-world dog training explanations, virtual dog simulation guidance, media captions, and in-app browser strings; verify catalog tests pass via `npm test -- src/i18n/`.
- [ ] 5.3 Run full test suite and TypeScript validation (`npm test && npx tsc --noEmit`) to verify complete integration and zero regressions.
