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

   **Spike result (task 1.1, 1.2).** The model is the **Husky by Quaternius**, from his *Ultimate Animated Animal Pack*, **CC0 1.0**. The author's page states CC0 (<https://quaternius.com/packs/ultimateanimatedanimals.html>), and so does the Poly Pizza listing it was downloaded from (<https://poly.pizza/m/wcWiuEqwzq>). It is stored unmodified at `scripts/kenney/models/quaternius-husky/husky.glb`, with `LICENSE.txt` next to it (source URLs, sha256, CC0 legal code). The Shiba Inu from the same pack has the same rig and would also do. The Husky won because its tail is straight with 6 bones, so it reads up/neutral/tucked; the Shiba's tail is curled.
   - Mesh: one skinned mesh, about 1,900 triangles, 5 flat-colour materials, no textures. The coat is recoloured light at render time (job `materials`), and the eyes and nose stay dark.
   - Bones (GLB names; three.js drops the `.`, so `Ear1.L` becomes `Ear1L`, and the script handles that):
     - spine: `Body`, `Back`, `Torso`, `Torso2`, `Torso3`
     - neck and head: `Neck1`, `Neck2`, `Neck3`, `Head`
     - ears: `Ear1.L`-`Ear4.L`, `Ear1.R`-`Ear4.R`
     - tail: `Tail1`-`Tail6`
     - front legs: `FrontShoulder`, `FrontUpperLeg`, `FrontLowerLeg` (`.L`/`.R`)
     - hind legs: `BackShoulder`, `BackLeg`, `BackUpperLeg`, `BackLowerLeg` (`.L`/`.R`)
     - leftover IK helpers: `IK*`, `FF*`, `PoleTarget*`. The clips are baked, so posing the leg bones directly works.
   - Clips: `Walk` (1.04 s loop), `Gallop` (0.54 s), `Idle`, `Idle_2`, `Idle_2_HeadLow` (a nose-down sniff), `Eating`, `Attack`, `Idle_HitReact_Left/Right`, `Jump_ToIdle`, `Gallop_Jump`, `Death`. **There is no trot clip.** `trot` has to come from `Gallop` sampled for a shorter stride, or from `Walk` with a longer one, to be settled in task 3.1.
   - Overrides: `render-sprites.mjs` takes per-job and per-clip `overrides: [{ bone, rotate: [x, y, z] }]`, in degrees, Euler XYZ, local to the bone. Each is multiplied onto the bone's animated rotation after `mixer.setTime`, and undone after the frame (`scripts/kenney/pose-overrides.mjs`, tested by `node --test scripts/kenney/*.test.mjs`). A posed clip is `{ clip: '<GLB clip>', times, overrides }` under a lowercase output name. On this rig a neck or head bone's local +z turns the head to the Dog's left.
   - Test pose: `walklook` (the `Walk` clip; `Neck1`-`Neck3` and `Head` each turned 30° about z, about 120° over the left shoulder toward the Handler behind). See the contact sheet `spike/rdog-walklook-contact-sheet.png`, cut from the packed atlas `spike/rdog-atlas/`, in a light, golden and black coat and at about phone size. The look-back reads clearly in facings 0, 135, 180, 270 and 315. It is weaker in 45 and 225, where the head turns toward or away from the camera, which is the ambiguity named under Risks. At phone size (about 30 px tall) it is a small change of outline, so the device check decides whether the yaw needs exaggerating there. The fine detail is the Dog portrait's job (Decision 5).
   - No-override renders are unchanged. The old and new scripts rendered the same stand-in job (42 frames, plain and `still` clips), and every new frame is byte-identical to one of the old script's own outputs. The old script is not byte-stable from run to run on its own: SwiftShader flips at most 2 pixels in some frames between two variants.

4. **Bake the tail into each clip by mood instead of combining tail × clip.** Clips: `idle`, `walk`, `walk_wag` (Check-in), `trot`, `sniffwalk`, `sniff` (in place), `planted`, `mark`, `lunge`, `look_l`/`look_r` (head turned while standing or walking slowly). Each clip sets its own tail. *Why:* every tail × clip combination would multiply the atlas; the walking sprite only needs the tail as a silhouette, and the Dog portrait carries the fine tail detail. Rough budget: about 30 frames per direction, 240 frames in all, against 74 frames for today's Dog.

5. **The Dog portrait is a layered 2D illustration composited in the bundle.** Layers: body base, head (level, up, down, turned left/right/to the viewer), ears (forward, neutral, back), eyes (to Handler, left, right, down), tail (high, wag A/B, neutral, tucked). These are drawn in the LeadMate Design System canvas in the close-view style, exported as PNG and packed into a `portrait` atlas. Combining layers gives every state from about 20 pieces. Coat by tint, as for the walking Dog. *Why:* a few pieces cover every combination and stay sharp at portrait size. *Alternative:* a fourth camera rendering the 3D model live. Rejected: per-frame GPU cost and a second renderer in the bundle.

6. **Dog portrait placement.** It is a fixed HUD element in a top corner, away from the back button, sized from the screen's short side (about 96-120 px), with its position computed in `src/hud/layout.ts` like the other HUD pieces so layout tests cover 320-point screens. It sits in the HUD layer, which takes no input. It redraws only when the derived state changes, or on a wag step (2 frames at about 4 Hz), to stay within "HUD redraws only on visible change".

7. **Overlay cues are trimmed, not removed.** The Check-in gaze line and eye stay (accessibility: not motion or colour alone). The Alert "?" and scent dots are kept until playtests show the new poses read on their own; removing them is a later tuning decision, not part of this change.

## Risks / Trade-offs

- [No rigged dog with a usable licence] → The spike is a go/no-go gate before any other art work. Fallback, in order: (1) build a simple rig on the current Cube Pet mesh (separate head and tail parts posed by transforms), which gives head turns and tail positions but no leg lift, so marking uses a lowered-hindquarters pose; (2) only if playtests show that rig still cannot be read, consider buying or commissioning a model.
- [Atlas grows about 3x for the Dog] → Keep palette quantisation; measure memory and load time on the low-end Android test device; the `power-efficiency` scenario regression check must pass with no increase above its tolerance.

  **Spike measurement (task 1.3), desktop stand-in.**
  - **Setup.** A stand-in full clip set was rendered from the Husky: 11 clips, 30 frames per direction, 240 frames, rough poses (`rdogest` in `render-sprites.mjs`). It was packed like the shipped atlas, then merged with the 157 non-Dog frames of today's `sprites.png` in place of the 72 Cube Pet frames (`scripts/kenney/spike/atlas-estimate.py`; result in `spike/estimate-atlas/`).
  - **New Dog frames alone:** 240 frames, 1024×552, 103 KB PNG, about 0.43 KB per frame.

  | | Shipped today | With the new Dog (estimate) |
  | --- | --- | --- |
  | Frames | 229 | 397 |
  | Atlas | 1024×944, 1 page | 1024×1316, 1 page (under 2048×2048) |
  | PNG | 180 KB | 240 KB (+60 KB) |
  | Base64 in the single-file bundle | 239 KB | 319 KB (+80 KB on a 1,923 KB `dist/index.html`) |
  | Decoded RGBA / texture | 3.69 MiB | 5.14 MiB (+1.45 MiB) |
  | Load ×1 CPU, median (worst) | 35 ms (83) | 40 ms (52) |
  | Load ×4 CPU, median (worst) | 106 ms (182) | 135 ms (184) |
  | Load ×6 CPU, median (worst) | 153 ms (218) | 195 ms (294) |

  Load time is Phaser `load.atlas` from a data URL, as the bundle does, to the texture being ready: PNG decode plus WebGL upload. It was measured in headless Chromium with SwiftShader and CDP CPU throttling, 30 loads each (`scripts/kenney/spike/atlas-load-time.mjs`). These numbers compare the two atlases; they are not phone timings. The cost grows about in line with the bytes (+25-30%), and it is paid once per Stage load, not per frame.

  **Go** (provisional), and the fallback rig is not needed:
  - the atlas stays on one page under 2048×2048;
  - it adds about 60 KB of PNG, about 1.5 MiB of texture memory, and about 40 ms at ×6 throttling;
  - the drawn Dog stays one sprite per frame, so the per-frame draw cost does not change.

  This turns into a no-go only if the low-end Android device shows a Stage load or memory problem with `spike/estimate-atlas/`. That device check is still open in tasks 1.2 and 1.3.
- [Portrait takes screen space on small phones] → Size from the short side with a minimum; layout tests at 320 points; it never covers controls.
- [Two drawings of one Dog disagree] → Both read the same derived state; a unit test maps each situation to one state.
- [Look-left/right reads ambiguously in some isometric directions] → Validate on device in all 8 directions during the spike; if needed, exaggerate head yaw for the side-facing directions.

## Migration Plan

Replace the Dog frames in the atlas and switch clip names in `StageScene` in one release; no data migration. Rollback: the previous atlas and `drawActors` code from git. The content packs are not touched.

## Open Questions

- Exact portrait corner and size per screen class: settled by the layout tests and a device check, without changing the spec.
- Final clip frame counts: tuned for looks within the atlas budget measured in the spike.

## Implementation notes (rd-pose)

- `src/hud/pose.ts` exports the unions `Gaze`, `Head`, `Ears`, `Tail`, `DogAction`, `WalkClip` and the pure `walkClipFor(pose)` that maps a pose to a walking-sprite clip, so the sprite and the Dog portrait read one state.
- `Gaze` has a sixth value, `ahead` (nothing in particular attended to), beyond the five in the spec; calm walking needs it. "Away left" is counter-clockwise from the Dog's facing in simulation coordinates; the bundle mirrors for the isometric view.
- Away gaze compares `dogFacing` with `dogDesired` (angle over 0.45 rad). Without a Dog moving, gaze is `ahead`.
- `planted` and `marking` are mapped from `dogMode` by string comparison; `rethink-unpredictable-walk-stage` only needs to add those modes. Their tests set the mode by cast.
- `tail: 'tucked'` is never derived yet (no situation in the spec calls for it); `sniff` action is `dogMode === 'sniffing'` with no desired movement, `sniff-walk` while it meanders.

## Portrait art as built (task 4.1)
- `bundle/assets/portrait/sprites.{png,json}`, made by `npm run art:hud` from `scripts/art/portrait/gen.mjs`. 19 layers, each drawn on one 256×256 canvas and stored trimmed (`spriteSourceSize` keeps the registration); every frame has the same `sourceSize` and pivot (0.5, 0.6172) = the neck anchor (128, 158). Stack at one origin in the order tail, body, head, ears, eyes.
- Frames: `portrait_body`; `portrait_head_{level,up,down,left,right,viewer}`; `portrait_ears_{forward,neutral,back}`; `portrait_eyes_{handler,left,right,down}`; `portrait_tail_{high,wag_a,wag_b,neutral,tucked}`.
- Decision: the skull is the same circle in every head layer and only the muzzle moves, so ears and eyes fit any head (a cartoon three-quarter turn); eyes therefore do not shift with a turned head. The Dog faces the viewer's right (`head_left` is its mirror).
- Coat is light (`coat.blanco`) with a `surfaceSunken` shade so a tint works; the green collar and ink outline are tinted too (accepted).

## Walking Dog as built (tasks 3.1-3.3)
- Own atlas: the shipped Husky is `bundle/assets/kenney/husky.{png,json}` (1024x552, 102 KB PNG, 240 frames, 30 per facing: idle 2, walk 4, walk_wag 4, trot 4, sniffwalk 4, sniff 2, planted 2, mark 2, lunge 2, look_l 2, look_r 2). *Why:* `sprites.png` already uses all 256 palette colours, so merging would recolour the Handler, Distractor and scenery frames, and those must stay byte-identical (the Kenney kit sources are not on hand to repack). Cost: one more atlas texture (1024x552 RGBA = 2.2 MiB) and 49 KB of JSON; `sprites.png` is unchanged. The old Cube Pet `dog_*` frames stay in the main atlas for the Distractor dog. Frame names `husky_<clip><n>_<facing>` (clip without underscore); `huskyFrame()` in `sprites.ts`.
- Pipeline: job `husky` in `render-sprites.mjs`, `pack-sprites.py --sets husky --name husky`. New pure features in `pose-overrides.mjs` (tested): `facingScale`, `facingExtra`, `perFrame` (tail wag). Fixed a bug found on the way: an override list naming a bone twice was undone first to last and left the bone posed; it is now undone last to first.
- Trot is `Gallop` at a shorter stride. `walk_wag` swings Tail2-4 +-25 degrees over a raised Tail1. `mark` raises `BackUpperLeg.L`.
- Side-on head turn: at facings 45 and 225 the head turns toward or away from the camera. On the near side the turn is scaled 1.6x; on the far side (look_l at 45, look_r at 225) the head hid behind the body, so the neck is lifted to bring it over the back. Before/after rows in `art/husky-contact-sheet.png`. It is better but still the weakest pair; the device check at phone size decides.
- Stage: `walkClipFor(pose)` picks the clip; `StageScene.dogFrame` steps it (`DOG_CLIP_FPS`). `StageOptions.reducedMotion` (default: the browser's `prefers-reduced-motion`) makes `walk_wag` hold frames 1 and 3. The shell does not pass it yet (`src/shell` is not part of this task), so on device it relies on the WebView's media query. Alert "?", scent dots, gaze line and eye are unchanged (Decision 7).
- Left/right: `look_l`/`look_r` are the Dog's own left/right. The screenshots show the head turning toward where the Dog wants to go; whether `away-left` in `pose.ts` (counter-clockwise in sim coordinates) matches the sprite's left should be confirmed on the device (1.2).
