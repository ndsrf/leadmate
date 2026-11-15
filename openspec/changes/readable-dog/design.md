# Design

## Context

- The walking Dog is the Kenney Cube Pets `animal-dog.glb`, rendered by `scripts/kenney/render-sprites.mjs` (three.js in headless Chromium) to 8 isometric directions with clips `idle` (1 frame), `walk` (4), `run` (2) and `eat` (2). `pack-sprites.py` trims, shrinks and palette-quantises the frames into `bundle/assets/kenney/sprites.{png,json}`.
- Coats are a tint (`DOG_COATS` in `bundle/src/sprites.ts`) on a light-coloured sprite, so one set of frames serves every coat.
- `StageScene.drawActors` picks the Dog's frame from `dogPose()` (`src/hud/pose.ts`) and the sim state. Today's state cues (the "?" for Alert, the gaze line and eye for a look, scent dots, bark arcs) are drawn on top with `Graphics`.
- The close view has its own 2D atlas (`bundle/assets/close/`) with five `dog_close_*` postures, drawn as illustrations.
- Constraints from existing specs: 30 fps frame cap, HUD redraws only on visible change, no audio in the bundle, Light-only colours in the Stage, everything readable from 320 points wide.

## Goals / Non-Goals

**Goals:**
- One derived Canine Posture (`canine-posture` spec) that drives both the walking sprite and the Dog portrait, so they never disagree.
- Readable silhouettes at the normal walking zoom; fine detail (ears, eyes, tail) in the Dog portrait.
- Art in place for planted and marking now, even though only `rethink-unpredictable-walk-stage` makes the Dog plant or mark.

**Non-Goals:**
- Breed-specific walking sprites. The walking Dog keeps one body shape; breed stays cosmetic (`dog-breed`).
- Camera zoom-ins on key moments.
- Changing the close-view exercises.

## Decisions

1. **Canine Posture lives in `src/hud/pose.ts`, as a pure function of `SimState`.** `DogPose` gains `gaze`, `head`, `ears`, `tail` and `action`, keeping the old flags as derived fields so existing callers keep working. *Why:* it already is the single place the bundle reads the Dog's look, it is unit-tested, and it cannot change the simulation. *Alternative:* store the state in the simulation. Rejected: it is presentation, and adding it to `SimState` would touch seeded behaviour for no gain.

2. **Gaze is relative to the Dog's own facing.** "Away left/right" is decided by the angle between the Dog's facing and the thing it attends to (a scent, a Distractor, the waypoint direction); "at the Handler" when the sim says the Dog is looking. The walking sprite turns only the head (not the body) toward the Handler. *Why:* a dog walking away that turns its head back is exactly the Check-in cue to learn.

3. **New rigged model, posed by bones in the render script.** The Cube Pet has no head or tail bones to pose. The spike looks for a CC0 (or similarly permissive) rigged quadruped dog in GLB with walk, trot and idle clips and separate head, ear and tail bones. `render-sprites.mjs` gets a per-job `overrides` step that rotates named bones after the clip time is applied (head yaw ±60°, head pitch down for sniffing, tail high/neutral/tucked, hind leg raised). *Why:* body poses × 8 directions from one model stay consistent and cheap to regenerate. *Alternatives:* hand-drawn 8-direction sprites (too much art for every pose and direction); keep the Cube Pet with overlay icons (it does not fix readability, which is the point).

4. **Bake the tail into each clip by mood instead of combining tail × clip.** Clips: `idle`, `walk`, `walk_wag` (Check-in), `trot`, `sniffwalk`, `sniff` (in place), `planted`, `mark`, `lunge`, `look_l`/`look_r` (head turned while standing or walking slowly). Each clip sets its own tail. *Why:* every tail × clip combination would multiply the atlas; the walking sprite only needs the tail as a silhouette, and the Dog portrait carries the fine tail detail. Rough budget: about 30 frames per direction, 240 frames in all, against 74 frames for today's Dog.

5. **The Dog portrait is a layered 2D illustration composited in the bundle.** Layers: body base, head (level, up, down, turned left/right/to the viewer), ears (forward, neutral, back), eyes (to Handler, left, right, down), tail (high, wag A/B, neutral, tucked). These are drawn in the LeadMate Design System canvas in the close-view style, exported as PNG and packed into a `portrait` atlas. Combining layers gives every state from about 20 pieces. Coat by tint, as for the walking Dog. *Why:* a few pieces cover every combination and stay sharp at portrait size. *Alternative:* a fourth camera rendering the 3D model live. Rejected: per-frame GPU cost and a second renderer in the bundle.

6. **Dog portrait placement.** It is a fixed HUD element in a top corner, away from the back button, sized from the screen's short side (about 96-120 px), with its position computed in `src/hud/layout.ts` like the other HUD pieces so layout tests cover 320-point screens. It sits in the HUD layer, which takes no input. It redraws only when the derived state changes, or on a wag step (2 frames at about 4 Hz), to stay within "HUD redraws only on visible change".

7. **Overlay cues are trimmed, not removed.** The Check-in gaze line and eye stay (accessibility: not motion or colour alone). The Alert "?" and scent dots are kept until playtests show the new poses read on their own; removing them is a later tuning decision, not part of this change.

## Risks / Trade-offs

- [No rigged dog with a usable licence] → The spike is a go/no-go gate before any other art work. Fallback, in order: (1) build a simple rig on the current Cube Pet mesh (separate head and tail parts posed by transforms), which gives head turns and tail positions but no leg lift, so marking uses a lowered-hindquarters pose; (2) only if playtests show that rig still cannot be read, consider buying or commissioning a model.
- [Atlas grows about 3x for the Dog] → Keep palette quantisation; measure memory and load time on the low-end Android test device; the `power-efficiency` scenario regression check must pass with no increase above its tolerance.
- [Portrait takes screen space on small phones] → Size from the short side with a minimum; layout tests at 320 points; it never covers controls.
- [Two drawings of one Dog disagree] → Both read the same derived state; a unit test maps each situation to one state.
- [Look-left/right reads ambiguously in some isometric directions] → Validate on device in all 8 directions during the spike; if needed, exaggerate head yaw for the side-facing directions.

## Migration Plan

Replace the Dog frames in the atlas and switch clip names in `StageScene` in one release; no data migration. Rollback: the previous atlas and `drawActors` code from git. The content packs are not touched.

## Open Questions

- Exact portrait corner and size per screen class: settled by the layout tests and a device check, without changing the spec.
- Final clip frame counts: tuned for looks within the atlas budget measured in the spike.

## Portrait art as built (task 4.1)
- `bundle/assets/portrait/sprites.{png,json}`, made by `npm run art:hud` from `scripts/art/portrait/gen.mjs`. 19 layers, each drawn on one 256×256 canvas and stored trimmed (`spriteSourceSize` keeps the registration); every frame has the same `sourceSize` and pivot (0.5, 0.6172) = the neck anchor (128, 158). Stack at one origin in the order tail, body, head, ears, eyes.
- Frames: `portrait_body`; `portrait_head_{level,up,down,left,right,viewer}`; `portrait_ears_{forward,neutral,back}`; `portrait_eyes_{handler,left,right,down}`; `portrait_tail_{high,wag_a,wag_b,neutral,tucked}`.
- Decision: the skull is the same circle in every head layer and only the muzzle moves, so ears and eyes fit any head (a cartoon three-quarter turn); eyes therefore do not shift with a turned head. The Dog faces the viewer's right (`head_left` is its mirror).
- Coat is light (`coat.blanco`) with a `surfaceSunken` shade so a tint works; the green collar and ink outline are tinted too (accepted).
