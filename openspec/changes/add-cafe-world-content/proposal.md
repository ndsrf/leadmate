# Proposal

## Why

World 7, "Terrazas y cafeterías", is a Plus Preview World with no Stops. It shows "Próximamente" and promises 4 walks, so Plus users who finish World 6 hit a dead end. Sitting at a terrace with a dog is one of the most common real-life wishes of dog owners, and it needs skills the app has not taught together yet. The dog has to settle on a mat for a long time, ignore food and waiters, and cope with dogs passing close by. The handler has to choose where to sit and leave before the dog falls apart.

## What Changes

- Make World 7 playable with **four Stretches**, each ending in a Mission:
  1. **Preparar la visita** (prepare the visit): a theory Lesson on choosing a table out of the waiters' path, arriving after a sniffing walk and bringing a mat. A walking Stage Node arriving at the terrace on a city street, with food on the ground to Leave-it. A Mission for a first short visit of about 10 minutes.
  2. **Relajación en mesa** (settling at the table): a theory Lesson on the mat, a chew and treats dropped while the dog is calm, never paying begging. A new **Terrace choose-the-action Minigame** Node. A Mission to settle through one coffee.
  3. **Paso de camareros** (waiters passing): a theory Lesson on gathering the leash short and slack, keeping the dog on the wall side, using your body as a shield and marking when the dog looks back. A close-view exercise Node where another dog passes by the table. A Mission about waiters and passers-by.
  4. **Irse a tiempo** (leaving in time): a theory Lesson on overload signals and leaving while it is still easy. A Mission that has the user leave before the dog is done.
- Add the **Terrace scene** to the existing "read the Dog, pick the action" Minigame. It is set at a café terrace. The Dog begs at the table, stares at a passing waiter, looks back at the Handler or lies relaxed. The buttons are Ignore, Wait, Marker and Feed from the table, and Feed from the table is never right, the way Cuddle is never right at home. This is new app code, so it needs a new app build.
- Add three **Image Duel** Checkpoint questions (which table, when to reward, how the leash goes as a waiter passes) and text Checkpoint questions for each Node.
- Add the World 7 art: new terrace symbols in the Lesson kit (table, chair, parasol, waiter, cup, chew, new Dog poses and top-view props) and 14 Lesson illustrations plus 3 Duel pairs. These come from the "Mundo 7" artboards in the LeadMate Design System canvas, are rendered through the repo kit and are wordless.
- Write all text in Spanish and English, in `content/beta/` first, then promote to stable.
- Remove World 7's `preview` flag. The map's Coming-soon Worlds and the "Más próximamente" card move to Worlds 8-9.
- Raise the app version and the pack's `minAppVersion` to 1.4.0, because a pack naming the new Minigame kind is rejected by older apps. Those apps keep their bundled baseline, where World 7 is still "Próximamente".
- **Out of scope**: a waiter sprite or a terrace theme in the walking and close views, legal advice on municipal rules (the Lessons tell the user to ask the venue), and a Node for Stretch 4.

## Capabilities

### New Capabilities
- `cafe-world`: World 7 and its four Stretches. It covers their Lessons, Nodes, Missions and Checkpoints, the method rules for terraces (mat, calm rewards, no paying begging, an exit), the content in both languages and its wordless art.

### Modified Capabilities
- `canine-minigames`: the choose-the-action Minigame gains the Terrace scene, with its states, buttons, correct actions, scene length, terrace backdrop and result metrics.
- `world-map-screen`: Coming-soon scenarios and the "Más próximamente" card refer to Worlds 8-9 instead of Worlds 7-9, now that World 7 is playable.

## Impact

- **Content**: `content/beta/worlds/cafe.yaml` (Stretches, no `preview`) and `cafe/{es,en}.md`. New folders for 4 Lessons, 3 Nodes and 4 Missions, each with `es.md` and `en.md`. `pack.yaml` gets the `minAppVersion` and `contentVersion` bumps. Promotion to stable and a regenerated baseline.
- **Code**: `src/shell/nodes/readDog.ts` (scene, states, actions, script, hints); `src/shell/nodes/node.ts` and `src/shell/content/schema.ts` (Minigame kind `cafe-settle`); `src/shell/screens/ReadDogView.tsx` and `src/shell/ui/MinigameProps.tsx` (the terrace scene); `src/shell/ui/canine.ts` (captions for the new states); `src/i18n/es.ts` and `en.ts`; tests for the engine, the content validation, the map and progression.
- **Art**: the new symbols in `scripts/art/lessons/_kit`; the scenes in `scripts/art/lessons/` and `scripts/art/nodes/<node-id>/`; PNGs in `assets/` and the regenerated art registries. The source is in the canvas artboards "Mundo 7 — Kit de terraza" and "Mundo 7 — Escenas de terraza".
- **Release**: app version 1.4.0 through an EAS build, since this is not OTA-only.
- **Specs**: the new `cafe-world` capability, plus deltas to `canine-minigames` and `world-map-screen`.
