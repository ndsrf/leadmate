# Proposal

## Why

Many owners don't know the basics of living with a dog. They lift it, take it to bed and kiss it. They give it attention whenever it asks indoors. When it barks nonstop they try to train it anyway. Most "misbehaviour" comes from not treating the dog as a dog, and the leash work in today's World 1 builds on habits these owners don't have yet. Many owners also believe their dog's quirks are unique ("he's just like that"). When they see that a behaviour is common and has a name, they are much more open to learning from an app. So the very first thing the app teaches should be that their dog is not unique.

## What Changes

- **New first World, "Mundo 1 · Un perro es un perro"**, placed before today's Home & Thresholds. It is a trail of three Stretches, each with theory Lessons, one new choose-the-action Minigame scene and a real-life Mission done at home:
  1. **Tu perro es un perro.** Opens with the "Tiene nombre" Lesson, which names behaviours owners think only their dog does: the turtle, zoomies, reacting to other dogs, redirected biting of the owner. Then: don't lift it, don't take it to bed, don't kiss it, and misbehaviour usually means we haven't treated it as a dog. Includes a How-to-play Lesson for the action buttons.
  2. **En casa se descansa.** Home is for resting. When the Dog comes asking for attention indoors, calmly send it away without looking at, talking to or touching it. Play and attention happen outdoors.
  3. **Primero, calma.** A Dog that barks nonstop or is racing around is too aroused to learn. Wait for calm before asking for anything, and reward the calm.
- **Three new Minigame scenes** on the existing "read the Dog, pick the action" engine, with new Dog states (begging to be lifted, on the sofa or bed, nudging for attention, toy indoors, barking nonstop, zoomies) and new actions (Ignore, Send away, Go outside, and a tempting Cuddle that is never right).
- **Three new home Missions**, each with Fixes.
- **BREAKING (numbering): World renumbering.** The new World is World 1. Home & Thresholds becomes World 2, the Quiet Sidewalk World 3, Urban World 4 and Park World 5, and the preview Worlds become 6 to 9. Home is now unlocked by the new World. Map visuals and World titles stop depending on the World number, so Home keeps its indoor look.
- **Existing users skip it.** Any Dog record that already has progress when this ships gets the new World marked complete (Lessons read, Nodes completed, Missions passed), with no celebration and no change to their current position. New users start on it.
- The content teaches calm, no-touch handling only. It never suggests physical punishment.

## Capabilities

### New Capabilities
- `dog-basics-world`: the content and rules of the first World: its Stretches, the "Tiene nombre" named-behaviours Lesson, the teaching rules the Lessons and Missions must follow, and marking it complete for existing users.

### Modified Capabilities
- `world-progression`: adds World 1 (Dog Basics) and renumbers Home, Sidewalk, Urban, Park and the preview Worlds. Home is unlocked by the new World. The trail scenarios that name World numbers change.
- `canine-minigames`: the choose-the-action Minigames gain three scenes with their own actions and Dog states. The expressive Dog gains the new states. The result covers the new scenes.
- `theory-lessons`: the trail Lesson Library label example moves with the renumbering ("Mundo 3 · Tramo 1").
- `real-world-missions`: the existing-progress scenarios are renumbered, and Missions may set a home target instead of a walk target.
- `world-map-screen`: Trail Scenery is chosen per World, not by World number, and the new World gets a living-room look with its own Top Landmark.
- `go-sniff`: the restriction moves from "World 1" to the two static Worlds (1 and 2).

## Impact

- `src/shell/world.ts` (WORLDS, unlock chain), `src/shell/nodes/readDog.ts`, `nodes/content.ts`, `nodes/node.ts`, `screens/ReadDogView.tsx`, `ui/canine.ts` (new states and poses), `missions/content.ts`, `lessons/content.ts`.
- `src/shell/dogRecord.ts`: `RECORD_VERSION` 7 → 8, with a migration that marks the new World complete for records with progress.
- `screens/WorldMapScreen.tsx`, `ui/WorldSceneryBackground.tsx`, theme world tokens: switch from World number to World id.
- `src/i18n/es.ts`, `es.trail.ts`: World titles, Lessons, Node, Minigame, Mission and Fix text. World title keys become id-based.
- `scripts/render-lesson-art.mjs` and `assets/lessons/`: illustrations for the new Lessons and How-to-play captures.
- Tests that use World numbers or `WORLDS[0]` as Home. Example scenarios in `activity-diary`, `barkdoku-puzzle` and `mission-day-skip` mention old World numbers only as examples. They are refreshed when this change is archived.
- No new dependencies. Sync is unchanged: read sets, completed Nodes and Missions already merge, and remote v7 copies are migrated when read.
