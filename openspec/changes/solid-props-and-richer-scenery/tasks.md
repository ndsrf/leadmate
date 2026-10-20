## 1. Footprints and collision (sim)

- [ ] 1.1 Add `PROP_SHAPES` (solid flag, radius or length) and `propWalls(scenery)` in `src/sim/scenery.ts`; unknown types default to a small solid disc
- [ ] 1.2 Build the combined `solidWalls` list (walls + prop walls, bucketed by 4 m grid) at sim state creation and use it for `resolveWalls`, `limitLeash`, `leashDist` and `hasLineOfSight`
- [ ] 1.3 Raise `MAX_CORNERS` to 6 in `src/sim/geometry.ts`; keep the no-obstacle fast path identical
- [ ] 1.5 Test: an Obstacle that is not a Visual Shield does not block sight; bumping emits no event or penalty
- [ ] 1.4 Tests: Handler and Dog stop at and slide along a solid prop; walkable props don't block; leash wraps a lamp post; determinism with the same seed

## 2. Density, variety and validation

- [ ] 2.1 Set `METERS_PER_PROP = 3` and `MIN_PROPS = 12` outdoors, an indoor floor-area rule with a minimum of 8, add `MIN_PROP_TYPES = 6` and extend `validateScenario`
- [ ] 2.2 Add ≥12 prop types per theme to `THEME_PROPS` (flower_bed, scooter, trash_can, fountain, kiosk, shelf, sofa, dog_bed, mailbox_row, garden_gnome, …)
- [ ] 2.3 `scatterScenery`: corridor clearance (≥1.2 m), no overlap with props/walls/starts, still seeded and deterministic
- [ ] 2.4 `validateScenario`: report solids that overlap or block a route leg
- [ ] 2.5 Update `scenery.test.ts` for the new density/variety/clearance rules

## 2b. Ground Cover

- [ ] 2b.1 Add `GROUND_ZONES` per theme (≥3 surfaces) and a seeded layout function along the Pathway in `src/sim/scenery.ts`, with tests for determinism and ≥2 surfaces per Stage
- [ ] 2b.2 Move `mat` to a rug patch and `pond` to water with an Obstacle ring; update `THEME_PROPS`
- [ ] 2b.3 Add small flat decorations (rugs, puddles, flower patches, painted lines)
- [ ] 2b.4 Check current bundle size, add Kenney CC0 tiles within about 300 KB, update credits and `LICENSE.txt`
- [ ] 2b.5 Seeded set-piece templates for the Daily Stage (bench + bin, tree + bush, parked-car row)
- [ ] 2b.6 Dog detour nudge when an Obstacle stalls it for about 3 s, with a test and no telemetry change

## 3. Rendering

- [ ] 3.0 Bake the ground into one render texture per Stage in `bundle/src/StageScene.ts` and draw Ground Cover beneath props
- [ ] 3.1 Draw every new prop type in `bundle/src/props.ts`, depth-sorted like the others
- [ ] 3.2 Optional debug overlay of footprints in `bundle/src/StageScene.ts`
- [ ] 3.3 Regenerate `src/shell/simHtml.generated.ts` with the embed script

## 4. Scenarios

- [ ] 4.1 Add hand-placed set pieces to the main Stages in `src/shell/nodes/scenarios.ts`
- [ ] 4.2 Check `src/shell/daily.ts` scatter still yields valid Daily Stages for a range of seeds
- [ ] 4.3 Confirm no persisted data references scenery (`src/shell/sync/configs.ts`)



## 5. Verification

- [ ] 5.0 Winnability test: scripted Handler reaches the end on every campaign scenario and 200 Daily seeds
- [ ] 5.1 Run the full test suite and the playtest script on every scenario; confirm each is completable
- [ ] 5.2 Manually play a hallway and a street Stage to check feel and that nothing can be walked through
