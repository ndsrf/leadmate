## Context

`SceneryItem` has `type`, `pos` and an optional `visualShield`/`radius` used only for line of sight. Movement collision (`resolveWalls`, `BODY_RADIUS = 0.3`) and leash wrapping (`leashPath`, which uses wall corner vertices and `segmentsCross`) only know `Wall` segments. `scatterScenery` places props 3-8 m off the route (0.6-1 m in indoor corridors), so props rarely sit on the route today, which is why collision never mattered.

## Goals / Non-Goals

**Goals:** solid props with footprints; leash wraps around them; much denser, more varied scenery with set pieces; guaranteed winnable layouts.
**Non-Goals:** movable props, physics, new art, new Distractors, scoring changes.

## Decisions

1. **Reuse the wall pipeline instead of a second collision system.** Each solid prop expands into `Wall` segments (a short capped segment for long props, a small octagon of 8 segments for round ones) computed by `propWalls(scenery)`; the sim concatenates `config.walls` with them into one `solidWalls` list built once at state creation. `resolveWalls`, `limitLeash`, `leashPath`, `hasLineOfSight` and `validateScenario` then work unchanged, and the leash wraps around prop corners for free. Alternative (separate disc collision plus separate leash-around-circle math) rejected: more code and a second set of bugs for the same behavior.
2. **Footprint table next to the draw table.** `PROP_SHAPES: Record<string, { solid: boolean; radius?: number; length?: number }>` lives in `src/sim/scenery.ts` (sim side, pure), keyed by prop type; unknown types default to a small solid disc. Walkable: `mat`, `picture` (wall-hung), `pond` edge is solid (water), `elevator_panel` and `door` are wall-mounted and stay non-solid since they sit on Boundaries.
3. **Octagon, not true circles.** The leash path code works on vertices; a coarse polygon gives wrap points and keeps `closestOnSegment` math. `MAX_CORNERS = 4` nearest corners is raised to 6 so an octagon beside a wall still wraps correctly; cost stays tiny.
4. **Only nearby solids are tested.** `propWalls` output is bucketed by a coarse grid (4 m cells) at state creation; `resolveWalls` and crossing tests receive the walls of the 3x3 cells around the body or leash segment. Without scenery nothing changes.
5. **Placement by rejection with clearance.** `scatterScenery` gains a corridor test (footprint distance to every route leg must exceed 0.6 + footprint radius so the clear corridor is at least 1.2 m) and an overlap test against placed props, walls and the two start positions. Indoor offsets stay wide enough. Density goes to `METERS_PER_PROP = 3`, `MIN_PROPS = 12`, plus `MIN_PROP_TYPES = 6`.
6. **Set pieces.** `StageSpec.scenery` already allows hand-placed items; add a few per main Stage (a bench cluster and a hydrant on the sidewalk, a crowded shelf and shoe rack in the hallway). They are validated like scatter.
7. **More prop types.** Add to `THEME_PROPS` and `drawProp`: flower_bed, scooter, trash_can (urban), fountain, kiosk (park/urban), shelf, sofa, dog_bed (indoor), mailbox_row, garden_gnome (suburb). Shape-drawn like the existing ones.
8. **Sniff spots deferred.** Making props sniffable (hydrant, tree base, bush) for the Dog is a follow-up change, so this one stays about shape and look.

## Decisions confirmed in review

- The term is **Obstacle** (see `GLOSSARY.md`): a prop with a footprint. Sight stays with the Visual Shield flag, so existing difficulty does not shift.
- Wrapping, not sliding off: the leash wraps around Obstacles like Boundary corners.
- No score or telemetry effect from bumping.
- Layouts of existing seeds may change. ADR 0005 already ties the Daily Stage layout (including scenery) to the date seed, so players on the same app version still get the same Stage each day.
- Indoor density is by floor area with a floor of 8 props, not 1 per 3 m.

## Ground Cover

- **Cosmetic only**: a separate layer, never read by the sim. A `GROUND_ZONES` list per theme (surface, length, optional hand-placed override) is laid along the route by seed in `src/sim/scenery.ts`, kept pure so tests can see it; the scene paints it.
- **Sources**: Kenney CC0 tiles for base surfaces (grass variants, dirt, sand, cobble, wood, tile, carpet); code-drawn shapes for small flat items. Credits go in the README and `bundle/assets/kenney/LICENSE.txt`.
- **Baked once**: the ground is drawn into a single render texture per Stage instead of one image per tile; the budget is about 300 KB of added bundle (check the current size before fixing the number in the spec).
- `mat` moves from props to Ground Cover; `pond` becomes water Ground Cover with an octagonal Obstacle ring at its edge.

## More decisions

- Daily Stage gets seeded templates (bench + bin, tree + bush, parked-car row) placed as groups.
- A deterministic detour nudge helps the Dog when an Obstacle stalls it for about 3 s; no new Drive or telemetry.
- Sniffable props are a follow-up change, not this one.
- Winnability gate: scripted Handler on every campaign scenario and 200 Daily seeds reaches the end.

## Risks / Trade-offs

- Denser scenery changes layouts for existing seeds and the Daily Stage → acceptable; tests asserting exact scatter output are updated.
- A solid between Dog and Handler could trap the leash → mitigated by clearance rules and by the existing leash-limit logic that already handles wall wraps; add a simulation test that a Dog circling a prop never produces NaN or a stuck Handler.
- Octagon sliding feels slightly faceted → radius is small relative to body radius; acceptable.
- `simHtml.generated.ts` must be regenerated (embed script) or the shell shows the old scene.

## Migration

None for stored data: scenery is derived from scenario code and seeds, not saved. Sync configs (`src/shell/sync/configs.ts`) reference scenarios by id; verify nothing persists scenery.

## Open Questions

- Should the Dog be allowed to sniff-wander toward props soon after this change (follow-up change)?
