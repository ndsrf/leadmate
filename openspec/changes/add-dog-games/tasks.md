# Tasks

## 1. Pack format for Dog Games

- [x] 1.1 Add the `games/` item kind to `src/shell/content/schema.ts` and `parser.ts` (`game.yaml` fields: `order`, `free`, `difficulty`, `minutes`, `materials`, `images`, `needs`, `youtube`; sections `intro`, `materials`, `steps`, `tips`, `safety`, `images`, `shop`); verify with parser tests that a complete game parses and a game missing Spanish text is rejected.
- [x] 1.2 Add game rules to `validator.ts` (unique id across all items, known difficulty, positive minutes, `needs` ids exist in the shop index, images exist in `media/` with Spanish alt text, safety note required for `fabric`/`plastic`/`bone` materials); verify with validator tests, one per rule, each asserting the error names file, field and hint.
- [x] 1.3 Add game media limits to the validator (PNG, 16:9, width ≤ 960, weight ≤ 250 KB) and verify with fixtures for oversized, wrong-ratio and wrong-format images.
- [x] 1.4 Document `games/` in `content/FORMAT.md` and `src/shell/content/formatGuide.ts` with a worked example; verify the guide-drift test (`formatConformance.test.ts`) passes and fails when a field is removed from the guide.
- [x] 1.5 Extend `scripts/content-validate.mjs` to cover games and verify `npm run content:validate -- beta` reports a deliberately broken sample game and passes a fixed one.

## 2. Resolving games per language

- [x] 2.1 Add `ResolvedGame` and `games` to `resolver.ts` (language fallback to Spanish, `needs` resolved through `ResolvedShop.idToKind`, targets the shop hides for the language dropped); verify with resolver tests for fallback, a missing target and a language-hidden target.
- [x] 2.2 Include games in `build.ts` and the generated baseline (text only, images downloaded); verify `npm run gen:baseline` output changes and `baselineHashes.test.ts` passes.
- [x] 2.3 Resolve game illustration paths through the pack-media resolver (`mediaResolver.ts`), with the themed placeholder when not downloaded; verify with a resolver test for the downloaded, pending and failed cases.

## 3. Game logic

- [x] 3.1 Add `src/shell/games.ts` with `pickRandomGame(ids, lastId, rng)` and `canSeeGame(game, plus)`; verify with `games.test.ts`: no immediate repeat with several games, single game returns itself, Free game open to all, Plus game open only with Plus (including an active trial through `isPlus`).
- [x] 3.2 Add the locked-bars model (bar count and widths from hidden text length, bounded) as a pure function; verify with a test that no hidden text is in its output.

## 4. Screens

- [x] 4.1 Add a Games glyph in `src/shell/ui/components.tsx` next to `GearGlyph` and `BasketGlyph`; verify with a render test that it draws with the ink outline at 20 points.
- [x] 4.2 Build `GamesScreen.tsx` (random button first, then rows with title, thumbnail, duration, difficulty, Plus marker for locked games); verify with `GamesScreen.test.tsx`: order follows `order`, row press opens the game, random press opens a game, Plus marker only for a non-Plus user on a non-Free game.
- [x] 4.3 Build `GameDetailScreen.tsx` (title, first illustration, intro always; materials, safety, steps, tips, further illustrations, shop links and video only when allowed; locked bars and Plus button otherwise; safety note in the materials block); verify with tests for Free user locked, Plus user open, Free-flag game open, and that locked text is absent from the render tree and hidden from accessibility.
- [x] 4.4 Reuse `ShopLinkCard`/`RecommendationCard` for each `needs` target and verify a test that its action opens the Shop at the target level and id.
- [x] 4.5 Add `es.ts` and `en.ts` strings (Juegos, random button, Plus lock label, duration and difficulty labels, safety heading); verify the i18n key-parity test passes.

## 5. Map entry, navigation and paywall resume

- [ ] 5.1 Add the Games `IconChip` to `WorldMapScreen.tsx` Row 1 next to the gear and basket, shown only when the pack has games, with the localized label and a 44-point target; verify in `WorldMapScreen.test.tsx`: shown with games, hidden without, order gear/basket/games, still on Row 1 at 320 points.
- [ ] 5.2 Add the `games` and `game` flows to `App.tsx` and `navigation.ts` with back handling (game → list → map, random included) over the mounted map; verify in `navigation.test.ts` and `App.test.tsx` for system back from the list, a listed game and a random game.
- [ ] 5.3 Add the paywall `then: { kind: 'game', gameId }` resume; verify in `App.test.tsx` that a trial started from a locked game returns to that game unlocked and a dismissed paywall returns to it locked.

## 6. Analytics

- [x] 6.1 Add the `games` and `game` screen names and a random-pick event to `src/shell/analytics/contract.ts` and its snapshot, without game text or dog data; verify `contract.test.ts`, `screen.test.ts` and the updated snapshot pass, and coordinate the snapshot with the in-flight `add-product-analytics`.

## 7. Illustrations and seed content

- [x] 7.1 Port the 6 scenes from the "Juegos con tu perro — primer lote" artboard into `scripts/art/games/` using the Lesson art kit; verify the render command produces 6 PNGs and the palette and no-text checks pass (adding the blue and croquette tones to the palette list only after reviewing the contact sheet).
- [x] 7.2 Render the PNGs to `content/beta/games/<id>/media/<id>-1.png` at 960×540 within the weight limit; verify `npm run content:validate -- beta` accepts every image.
- [x] 7.3 Author the 6 seed games in Spanish and English (`eleccion-mano` as the Free sample, `manta-enrollada`, `pienso-a-oscuras`, `manta-buscadora`, `trilero`, `escalon-azul`) with materials, steps, tips, safety notes and alt text; verify content validation passes and a manual read of each Spanish file against the artboard captions.
- [x] 7.4 Add the `mantas-olfativas` Subcategory (text es/en) and link `manta-buscadora` to it; add real Products only when the author supplies buy links; verify the game's link is hidden while the Subcategory has no visible product and appears once one exists.
- [ ] 7.5 Record the remaining 16 games from the author's list as a content backlog in `docs/content/dog-games-backlog.md` with their families and material needs; verify the file lists all 22 games exactly once.

## 8. Vocabulary and integration

- [x] 8.1 Add **Dog Game** to `GLOSSARY.md` (real-world activity with the real dog, not a Minigame) and add "Dog Game" to the Minigame entry's _Avoid_ list; verify by reading both entries together.
- [ ] 8.2 Run `npm run typecheck`, `npm test` and `npm run content:validate -- beta` and verify all pass.
- [ ] 8.3 Check on a device with the beta channel: chip appears, random works, free sample is open, a Plus game is locked then unlocks after starting the trial from it, shop link opens the Shop at the target, Android back returns list then map, and a game with an undownloaded image shows the placeholder offline.

## Workflow follow-up

- Promote the 6 games from beta to stable with `content:promote` once reviewed on a device, then archive this change.
