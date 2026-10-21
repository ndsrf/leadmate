# Proposal

## Why

Currently, static minigames (Doorbell Mat, Poste, Harness Ritual) rely on abstract color-changing blocks and progress bars where users simply time button presses without any visual connection to canine body language or behavior. Additionally, Theory Primers lack comprehensive real-world dog training explanations, do not clarify how virtual dog simulation mechanics work, and have no support for hosting or embedding external images, diagrams, video content, or web-hosted tutorial links.

## What Changes

- Overhaul minigame user interfaces with dog-centric visual representations: replace abstract boxes and tension bars with visible canine postures (alert, barking, settling, calm on mat; pulling against leash, relaxing, sitting) and environmental context (doorbell cues, mat placement, leash tension curve).
- Restructure the Theory Primer into distinct pedagogical sections: real-world dog handling theory (canine psychology, threshold management, desensitization) and virtual dog simulation instructions (interpreting the virtual dog's visual/audio cues and operating the controls).
- Add remote media support, web tutorial links, and rich placeholders: enable nodes to reference external images, video guides, and web-hosted tutorials viewable in an in-app slide-over browser, with styled canine-themed placeholders and graceful fallbacks when offline or media is pending.
- Extend Node data definitions and localization catalogs to accommodate dual-aspect theory content and remote media metadata.

## Capabilities

### New Capabilities
- `canine-minigames`: Graphical canine representations, behavioral animation states, and contextual environmental feedback for static minigames (Doorbell Mat, Poste Practice, and Harness Ritual).
- `remote-media-content`: External media integration (images, diagrams, video streams, web tutorials) with an in-app slide-over browser and resilient placeholder components for lesson content.

### Modified Capabilities
- `training-node-loop`: Structured dual-aspect Theory Primers (real-world dog training theory vs virtual dog gameplay mechanics), Checkpoints focused on real-world principles, and Node schema extensions for media attachments.

## Impact

- **Shell Components**: Overhaul of `DoorbellMatView.tsx` and `PosteMinigameView.tsx`; update `PrimerScreen.tsx` to display dual-aspect theory cards, embedded media or media placeholders, and an in-app tutorial browser modal.
- **New UI Components**: `CanineMinigameAvatar` for static minigames; `MediaPlaceholder`, `InAppBrowserModal`, and `MediaViewer` components.
- **Node Data & Schemas**: Updates to `NodeDef`, `NodeRun`, `content.ts`, and i18n text catalogs (`en`, `es`) with expanded real-world and virtual dog guidance.
- **Dependencies**: React Native standard image and webview integration patterns (or lightweight safe SVG/vector rendering without heavy native binary overhead).

## Reopened: visual rework (2026-10-21)

After `solid-props-and-richer-scenery` the walking Stages look rich while the static Minigames still look crude: the Dog is a blob of rounded rectangles in a fixed amber, the Door and Mat are flat boxes, the Leash is a stack of rotated bars, and a 160px-tall text-only button is the only affordance. It is unclear what the Dog is doing, when to act, and whether an action worked.

- Redraw the Dog, Door, Mat, Handler and Leash as vector art (`react-native-svg`) with real anatomy per posture, in the Dog's chosen coat.
- Stage each Minigame as one scene (wall, floor, props); in the Doorbell Mat the Dog walks from the door to the mat.
- Name what the Dog is doing in a short caption, so the user learns to read body language instead of guessing.
- Replace the plain Pad with a raised action button carrying an icon, a pressed state, and a clear idle/active look.
- Show round progress and each outcome as colour-coded pips and a result chip.
