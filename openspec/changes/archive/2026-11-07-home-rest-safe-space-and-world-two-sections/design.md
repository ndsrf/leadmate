# Design

## Context

World 2 (`home`, defined in `content/<channel>/worlds/home.yaml`) holds three fixed threshold Stretches. For a Dog with declared Concerns, `worldsFor` in `src/shell/world.ts` adds their Home Stretches to World 2 (`homeStretchesInWorldTwo`) and sorts each Stretch with a key `[started ? 0 : 1, group, indexInPlan, original]`, where `group` is 0 (biting Home Stretch), 1 (other Home Stretch) or 2 (threshold). `mapModel` (`src/shell/mapModel.ts`) flattens `world.stretches` into `MapWorld.stops` (each `MapStop` carries its 0-based `stretch`), and `WorldArena` in `src/shell/screens/WorldMapScreen.tsx` draws them as one `NodeRow` list in a container of height `stops.length * ROW_HEIGHT`; the scroll-to-next-up effect also computes `y` from `index * ROW_HEIGHT`. A Stretch is a Home Stretch exactly when `homeConcernOfStop(stops[0])` is defined. Lesson content is a Content Pack: edits go to `content/beta/`, promoted to `content/stable/`, and `src/shell/content/baseline.generated.ts` is generated from stable.

## Goals / Non-Goals

**Goals:**
- Draw World 2 as two titled sections without changing the World model, numbering, unlock rules, gating or progress counts.
- Keep the section decision in the pure map model so it is unit-testable, and keep the screen a drawing of that data.

**Non-Goals:**
- No new World, no change to `WorldDef`, `unlockedBy`, `FIRST_WALKING_WORLD`, scenarios, record version or the Personal Plan.
- No sections in other Worlds; no `en.md` for the Lesson.

## Decisions

1. **Section is derived data on the map model, not stored.** `mapModel` adds an optional `section?: 'dog' | 'more'` to `MapStop`, set only for World `home` (`'dog'` when the Stop's Stretch is a Home Stretch, `'more'` otherwise), and `MapWorld.sections?` listing the non-empty sections with their first stop index. Alternative: a new World or a `section` field in the YAML. Rejected: the YAML is content for the fixed threshold Stretches only, Home Stretches are injected per Dog in code, and a new World would renumber things.

2. **Sections must be contiguous, so the home sort key puts group before "started".** Today a started threshold Stretch sorts ahead of unstarted Home Stretches (`started` is the first key element), which would split "Para tu perro" in two. In `worldsFor`, for World `home` only, the key becomes `[group(0 or 1 vs 2), started, group, plan index, original]`, i.e. Home Stretches always precede threshold Stretches, which is what the existing "Home Stretches in World 2" requirement already states. Other Worlds and World 1 keep their keys. The Stretch gate (a Stretch opens when the Mission before it is passed) applies to this order, so a Dog that started a threshold Stretch before its unstarted Home Stretch now meets the Home Stretch gate first. Alternative: keep the order and split the section into non-contiguous runs. Rejected as confusing. The prerequisite-Node reordering pass after the sort is unaffected.

3. **Rendering: one trail, section header bands between rows.** The title bands are drawn inside the existing path container as absolutely positioned rows of a fixed height (`SECTION_HEADER_HEIGHT` in `src/shell/ui/mapLayout.ts`); Stop `i` is shifted down by the headers before it. The container height becomes `stops.length * ROW_HEIGHT + headers * SECTION_HEADER_HEIGHT`, and a helper in `mapLayout.ts` returns the y offset of a stop index, used by both `WorldArena` and the scroll-to-next-up effect so they cannot diverge. Connectors and the zig-zag use the global stop index so the trail stays continuous across the section break. Alternative: two stacked path containers. Rejected: it breaks the connector between the last Stop of one section and the first of the next and duplicates the scenery sizing (`stopCount`, now headers included).

4. **Empty "Para tu perro" is simply not emitted.** `sections` lists only non-empty sections. With only "Más cosas de casa" present the header is still drawn (assumption: it is the same World the Dog sees later when Concerns are added, and the proposal only hides the empty section). The map does not draw sections for Worlds other than `home`, and not for preview or collapsed (locked/completed) renderings of World 2, which stay header rows.

5. **Texts in i18n.** Two keys in `src/i18n/es.trail.ts` next to `map.stretch`: `map.section.forDog` = "Para tu perro" and `map.section.moreHome` = "Más cosas de casa" (check `es.home.ts` for the existing "Home Behaviours section" naming before choosing the file). The header band needs an accessibility role of header and uses existing design-system tokens.

6. **Lesson content.** Edit `content/beta/lessons/theory-home-rest/es.md` only, then promote. The Lesson is at the content limits (`takeaways: 4` and `steps: 5` in `lesson.yaml`, `why` 60-110 words, steps 12-30 words, body 350-700), so new content replaces and tightens text instead of adding sections: the myth and the size criterion go into `## why`, the place into step 2, and the do / don't and one takeaway are rewritten. If a new illustration is needed it is listed in `## images` and added under `media/`; `lesson.yaml` `images` and `steps`/`takeaways` counts are kept in sync.

## Risks / Trade-offs

- [Layout offsets drift between rendering and scroll] -> one shared offset helper plus a unit test of it; check on a device that the next-up Stop is centred in World 2.
- [Changed sort key alters the gate for a Dog with a started threshold Stretch] -> rare, matches the existing spec; covered by a `worldsFor` test, and a Stretch the Dog started is still open (the started-Home rule is untouched).
- [Lesson over the word limit] -> `npm run content:validate -- --channel beta` fails loudly; trim before promoting.
- [Generated baseline out of date] -> `content:promote` regenerates `baseline.generated.ts`; commit it with the stable content.

## Migration Plan

No data migration and no record version change. Rollback is reverting the commit; progress is untouched because section membership is derived at render time.
