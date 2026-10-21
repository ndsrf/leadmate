# Design

## Context

Static minigames (`DoorbellMatView.tsx` and `PosteMinigameView.tsx`) currently render abstract colored rectangles and linear progress bars. The user presses a button when the box turns green or holds a button against a rising bar. This lacks connection to canine behavior, body language, or real-world leash handling.

Furthermore, Theory Primers (`PrimerScreen.tsx`) currently present 3-5 short sentences without distinguishing between how to train the behavior with a real dog versus how to control the virtual dog in the app. There is also no provision for referencing external instructional media (images, diagrams, video tutorials, or web-hosted guides) or displaying structured placeholders when media is hosted remotely.

## Goals / Non-Goals

**Goals:**
- Provide dog-centric visual interfaces for static minigames: render canine postures (alert, barking, settling, resting calmly, straining into leash, relaxed slack), environmental props (doors with chime indicators, target mats, dynamic leash curve between handler and dog), and canine-driven timing feedback.
- Structure Theory Primers into clear pedagogical sections: Real-World Canine Application (canine psychology, timing, threshold) and Virtual Dog Mechanics (reading the virtual dog's cues and operating controls). Checkpoints strictly test real-world handling principles.
- Build a resilient media framework: declarative media references in nodes (`image`, `video`, `tutorial`), an in-app slide-over browser (`InAppBrowserModal`) for rich web-hosted guides, and styled canine-themed placeholders for offline/unhosted states.
- Keep the underlying simulation state machines (`doorbellMat.ts`, `posteMinigame.ts`) pure, deterministic, and fully testable.

**Non-Goals:**
- Modifying the 2.5D isometric walking simulation engine (`SimView`, WebGL/three.js sim) used in walking stages.
- Bundling large multi-megabyte video files into the mobile app binary.
- Rewriting the core leash physics math or dog learning attributes engine.

## Decisions

### Decision 1: Declarative Canine Visual Component (`CanineMinigameAvatar`)
- **Choice**: Implement a lightweight vector/styled component (`CanineMinigameAvatar`) representing canine body posture, ears, tail, and orientation, parameterized by canine state (`standing_waiting`, `alert_barking`, `settling_towards_mat`, `calm_sphinx_on_mat`, `straining`, `slack`).
- **Rationale**: Avoids heavy bitmap sprite downloads, renders crisply across all screen densities, runs smoothly at 60fps on low-end devices without native bridge bottlenecks, and adheres to project styling tokens.
- **Alternatives considered**:
  - *Bitmap sprite animations*: Large asset payload, resolution scaling artifacts, inflexible color/theme variations.
  - *Full 3D WebGL model*: High CPU/battery overhead, unnecessary complexity for static 2D minigames.

### Decision 2: Dual-Aspect Theory Primer Architecture & Real-World Checkpoint Focus
- **Choice**: Extend the Theory Primer card model to categorize cards as `'real-world'` or `'virtual-dog'`. Display distinct visual section headers/badges (`Real-World Dog Handling` vs `Virtual Dog Simulation`) while maintaining the linear 30-60s card progression. Ensure the 5-second Checkpoint tests real-world handling principles rather than virtual button controls.
- **Rationale**: Keeps the user experience focused and frictionless while ensuring users understand both the practical canine behavior principles and the game's interactive cues.
- **Alternatives considered**:
  - *Separate tabbed screens*: Adds navigation cognitive load and allows users to bypass essential real-world theory.

### Decision 3: Web-Hosted Tutorials & In-App Slide-Over Browser
- **Choice**: Enable nodes to specify an external web tutorial URL (`tutorialUrl`). Theory Primer cards remain complete, offline-first summaries in the app bundle. An "Open Full Guide" button triggers an `InAppBrowserModal` slide-over rendering the web page (with rich images and videos) inside the app, complete with an offline fallback view and close button. See `docs/adr/0008-web-hosted-tutorials-and-placeholders.md`.
- **Rationale**: Keeps the app lightweight and 100% functional offline, while allowing content creators to publish and update rich web tutorials without releasing app binary updates.
- **Alternatives considered**:
  - *Bundled videos*: Bloats binary, platform-specific decoding bugs.
  - *External OS browser redirect*: Disrupts lesson flow and causes user abandonment.

### Decision 4: Minigame Scene Props, Canine Leash Dynamics, and Posture Transitions
- **Choice**:
  - In `DoorbellMatView`: Render Door prop with animated chime ripple and target Mat prop. The Dog cycles through `standing_waiting` → `alert_barking` → `settling_towards_mat` → `calm_sphinx_on_mat`. An early Mark press triggers an agitated canine response, reinforcing that marking uncalm behavior is an error.
  - In `PosteMinigameView`: Render Handler anchor point and an interactive Bezier leash curve. Under tension, the Dog visibly leans forward straining against the collar/harness and the leash vibrates taut. When held, the tension drops, the Dog eases back into a relaxed sit or slack stance, and the leash curves into slack.
- **Rationale**: Transforms an abstract button-timing game into an intuitive simulation of reading canine body language and leash tension.

## Risks / Trade-offs

- **[Risk]** Heavy media assets or slow remote connections degrade lesson pacing.
  → **Mitigation**: Core cards are fully self-contained offline; web tutorial slide-over is an optional deep-dive that displays an immediate offline banner if disconnected.
- **[Risk]** Complex vector animations could impact low-end device battery or CPU.
  → **Mitigation**: Use simple pure React Native views and SVGs with declarative CSS transforms; avoid continuous JS-driven layout re-renders.
- **[Risk]** Backwards compatibility with existing node definitions in `content.ts`.
  → **Mitigation**: `NodeDef.primerCards` will support both legacy `TextKey[]` and new structured card objects `PrimerCardDef[]`.

## Migration Plan

1. Define `PrimerCardDef`, `NodeMedia`, and `tutorialUrl` types in `src/shell/nodes/node.ts`.
2. Implement `CanineMinigameAvatar.tsx`, `MediaPlaceholder.tsx`, and `InAppBrowserModal.tsx` in `src/shell/ui/`.
3. Upgrade `DoorbellMatView.tsx` with canine avatar, door chime, and mat props.
4. Upgrade `PosteMinigameView.tsx` with handler-dog layout, dynamic leash curve, and canine strain/settle postures.
5. Upgrade `PrimerScreen.tsx` with dual-aspect section indicators, media placeholder rendering, and in-app tutorial launcher.
6. Update node definitions and i18n catalogs (`en.ts`, `es.ts`) for Poste, Harness, and Doorbell nodes.

## Reopened: visual rework decisions

### Decision 5: Vector scenes with `react-native-svg`
- **Choice**: Draw the Dog, Handler, Door, Mat and Leash as SVG. Postures differ in anatomy (standing, barking with head up and open mouth, walking mid-stride, lying sphinx, braced straining, sitting), not just in a tilt. The Leash is one path whose control point follows tension.
- **Rationale**: The Kenney atlas Dog only has idle/walk/run/eat frames, so it cannot show sit, lie or bark; rectangles cannot read as a dog. SVG stays resolution independent and needs no assets.
- **Trade-off**: One new dependency, `react-native-svg` (bundled in Expo Go and supported on web).

### Decision 6: Coat from the Dog record, palette outside screens
- Coat colours (fill, shade, belly) live in `canine.ts`, mirroring the Stage tints in `bundle/src/sprites.ts`; screen files keep drawing only from theme tokens.

### Decision 7: Caption and button state teach the cue
- A short caption names the Dog's state ("Barking at the bell", "Settling", "Calm on the mat") without colouring the right moment, so the exercise still tests reading the Dog.
- The action button is raised with an icon and a pressed state; results appear as a coloured chip and round pips.
