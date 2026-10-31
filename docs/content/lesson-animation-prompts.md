# Lesson Animation prompt book

How to make the Lesson Animations: short, silent clips in the style of the Lesson illustrations, generated with
Gemini / Veo and hosted outside the app (ADR [0016](../adr/0016-hosted-lesson-animations-and-youtube-origin.md)).
One entry per animation key in `src/shell/lessons/lessonMedia.ts`; `conformance.test.ts` fails when a key has no
`## <key>` entry here. Each prompt below is complete on its own: it already contains the style and avoid blocks, so
paste it as it is.

Each entry also names its **beats** (ids and target times) and its **Lines**: the short words the Person says, which
the app shows as subtitles with text from the catalog (`lesson.<n>.animation.line.<id>`). A Line marked `voice: cue`
is the Handler's Cue, `voice: marker` the spoken Marker word. A prompt with a Line asks the Person to *visibly* say
the word, silently, with no speech bubble: the clip never carries text. Each entry ends with its **target
timeline**, the Animation Timeline to save as `docs/content/animations/<key>.json` until the clip is measured.
`conformance.test.ts` checks that every entry's beat ids and Lines match that file.

## How to use

1. Open Veo: the Gemini app (Video), Google AI Studio or Flow.
2. Settings: **16:9**, **720p or 1080p**, **8 seconds**. Turn audio off if the tool offers it; the export step strips
   it anyway.
3. Attach the entry's **starting image** (`assets/lessons/<key>-anim.png`) as the first frame / image reference. It is
   also the poster the app shows before the tap, so the clip continues from the picture already on screen.
4. Paste the entry's **prompt**. Generate two or three takes.
5. Check each take against the entry's **acceptance checks** and the shared ones below. Regenerate until one passes;
   if a detail keeps drifting, add it to the prompt's last sentence ("Keep the leash green and attached to the harness").
6. Measure its beat and Line times with the timing prompt ("Measure the timings") and save them.
7. Export and upload it (last section). Until a clip passes its checks, it stays on
   [stand-in-content.md](stand-in-content.md).

Shared acceptance checks, for every clip:

- Same look as the starting image: flat paper-cut, ink outlines, flat fills, same Dog and Person, same colours.
- No text, letters, numbers, logos or subtitles anywhere, not even on signs.
- The idea is clear with the sound off, from the picture and the caption alone.
- Calm, slow motion; locked camera; no morphing limbs, extra legs or a second dog or person that is not listed.
- No harsh handling: no leash pops, jerks, pulling the dog, raised voice gestures.
- 8 s or less, loops without a jarring jump (the last beat settles into a calm pose).
- Line timing: in the measured timeline, each Line's range covers the moment the Person's lips move for that word,
  and the beats match what the clip shows (check by scrubbing, see "Measure the timings").

## Shared style block

Pasted first into every prompt:

> Flat paper-cut 2D animation in the exact style of the reference image: thick dark-navy ink outlines (#1E2A3A),
> flat colour fills, no gradients, no textures, soft kit ground shadow only. Warm cream and pale sky background
> (#F6EFE0). The same honey-coloured mascot dog as in the reference image (coat #E8B26A, darker ears and back legs
> #B9783A, light belly #F6E3C0) wearing a green harness, and the same person as in the reference image (red-orange
> top, navy trousers, dark hair). Gentle, slow, calm motion like a cut-out puppet animation. Locked side-view camera,
> no zoom, no pan. One idea per clip.

## Shared negative block

Pasted last into every prompt:

> Avoid: any text, letters, numbers, subtitles, speech bubbles or signs with writing; logos; anything that needs
> speech or sound to understand; photorealism; 3D rendering; camera shake, zoom or cuts; extra animals or people
> unless listed; leash pops, jerks, yanking or any harsh correction; the dog looking scared or in pain.

## calm-leash

- **Lesson:** `calm-leash`, Lo básico de un paseo tranquilo (Day 1)
- **Caption:** Correa tensa, te paras; correa floja, seguís
- **Idea:** a tight leash stops the walk; a loose leash lets it go on.
- **Starting image:** `assets/lessons/calm-leash-anim.png`
- **Timeline** (target times; beat ids as in the timeline):
  - `pull`, 0–3 s: the dog pulls toward the tree on the right; the leash snaps straight.
  - `stop`, 3–6 s: the person stops completely, still as a post, arms relaxed; the dog keeps leaning for a moment.
  - `walk-on`, 6–8 s: the dog looks back at the person, the leash drops into a loose J, and they walk on together.
- **Lines:** none; the Person stays silent (the timeline holds beat times only).

**Prompt:**

> Flat paper-cut 2D animation in the exact style of the reference image: thick dark-navy ink outlines (#1E2A3A),
> flat colour fills, no gradients, no textures, soft kit ground shadow only. Warm cream and pale sky background
> (#F6EFE0). The same honey-coloured mascot dog as in the reference image (coat #E8B26A, darker ears and back legs
> #B9783A, light belly #F6E3C0) wearing a green harness, and the same person as in the reference image (red-orange
> top, navy trousers, dark hair). Gentle, slow, calm motion like a cut-out puppet animation. Locked side-view camera,
> no zoom, no pan. One idea per clip.
> Scene: a pavement with a tree on the right. 0 to 3 seconds: the dog pulls toward the tree and the green leash
> between the person's hand and the harness is pulled perfectly straight. 3 to 6 seconds: the person stops walking
> and stands completely still like a post, holding the leash at their side without pulling back; the dog leans
> forward a moment longer. 6 to 8 seconds: the dog turns its head and looks back at the person, the leash goes slack
> and hangs in a loose J-shaped curve, and the two start walking forward together calmly. Keep the leash attached to
> the hand and the harness the whole time.
> Avoid: any text, letters, numbers, subtitles, speech bubbles or signs with writing; logos; anything that needs
> speech or sound to understand; photorealism; 3D rendering; camera shake, zoom or cuts; extra animals or people
> unless listed; leash pops, jerks, yanking or any harsh correction; the dog looking scared or in pain.

**Target timeline** (save as `docs/content/animations/calm-leash.json` until the clip is measured):

```json
{
  "version": 1,
  "duration": 8,
  "beats": [
    {"id": "pull", "start": 0, "end": 3},
    {"id": "stop", "start": 3, "end": 6},
    {"id": "walk-on", "start": 6, "end": 8}
  ],
  "lines": []
}
```

**Acceptance checks:**

- The person never pulls the leash back; they only stop.
- The walk restarts only after the leash is slack.
- The leash is clearly straight in beat 1 and clearly curved in beat 3.

## body-language

- **Lesson:** `body-language`, Leer el lenguaje corporal (Day 2)
- **Caption:** Las primeras señales piden distancia
- **Idea:** the first, small stress signals are the moment to add distance.
- **Starting image:** `assets/lessons/body-language-anim.png`
- **Timeline** (target times; beat ids as in the timeline):
  - `sniff`, 0–3 s: the dog sniffs the verge, relaxed: loose mouth, soft tail low.
  - `freeze`, 3–6 s: a skateboarder appears small in the distance on the right; the dog freezes: mouth closed, weight forward,
    tail high and stiff, a quick lip lick.
  - `turn-away`, 6–8 s: the person turns calmly and walks away to the left; the dog follows, its body softens and it sniffs again.
- **Lines:** «vamos» (`vamos`, `voice: cue`), in beat `turn-away`, about 6.2–7.2 s. Shown as a subtitle by the app; the clip itself carries no text.

**Prompt:**

> Flat paper-cut 2D animation in the exact style of the reference image: thick dark-navy ink outlines (#1E2A3A),
> flat colour fills, no gradients, no textures, soft kit ground shadow only. Warm cream and pale sky background
> (#F6EFE0). The same honey-coloured mascot dog as in the reference image (coat #E8B26A, darker ears and back legs
> #B9783A, light belly #F6E3C0) wearing a green harness, and the same person as in the reference image (red-orange
> top, navy trousers, dark hair). Gentle, slow, calm motion like a cut-out puppet animation. Locked side-view camera,
> no zoom, no pan. One idea per clip.
> Scene: a quiet pavement with a tree on the left and a bush far right. 0 to 3 seconds: the dog sniffs the ground,
> relaxed, mouth slightly open, tail low and loose, the leash hanging. 3 to 6 seconds: one skateboarder, drawn in the
> same flat style, appears small in the far distance on the right; the dog stops sniffing and freezes: mouth closed,
> body weight shifted forward, tail raised high and stiff, a quick lick of the lips. 6 to 8 seconds: the person turns
> around calmly and, as they turn, visibly says one short word to the dog (lips move once, calm friendly face; silent, no speech bubble, no text), then
> walks away to the left without pulling; the dog turns and follows, its body relaxes, its tail
> lowers and it starts sniffing again. The skateboarder stays far away and small.
> Avoid: any text, letters, numbers, subtitles, speech bubbles or signs with writing; logos; anything that needs
> speech or sound to understand; photorealism; 3D rendering; camera shake, zoom or cuts; extra animals or people
> unless listed; leash pops, jerks, yanking or any harsh correction; the dog looking scared or in pain.

**Target timeline** (save as `docs/content/animations/body-language.json` until the clip is measured):

```json
{
  "version": 1,
  "duration": 8,
  "beats": [
    {"id": "sniff", "start": 0, "end": 3},
    {"id": "freeze", "start": 3, "end": 6},
    {"id": "turn-away", "start": 6, "end": 8}
  ],
  "lines": [
    {"id": "vamos", "start": 6.2, "end": 7.2, "voice": "cue"}
  ]
}
```

**Acceptance checks:**

- The change in the dog's body (closed mouth, high stiff tail, weight forward) is readable at phone size.
- The skateboarder never comes close; the person moves away before anything happens.
- The dog is not barking, lunging or showing teeth.
- The Person's lips move once as they turn (Line `vamos`), and that moment falls inside the timeline's `vamos` range.

## smile-leash

- **Lesson:** `smile-leash`, La correa en sonrisa (Day 3)
- **Caption:** Premia la correa en sonrisa junto a tu pierna
- **Idea:** pay the slack leash, at your leg, while walking.
- **Starting image:** `assets/lessons/smile-leash-anim.png`
- **Timeline** (target times; beat ids as in the timeline):
  - `walk`, 0–3 s: they walk together, the leash hanging in a smile curve.
  - `treat`, 3–6 s: the person brings a small treat down to the trouser seam, at the dog's mouth height.
  - `take`, 6–8 s: the dog takes it beside the leg and keeps walking close, the leash still curved.
- **Lines:** «bien» (`bien`, `voice: marker`), in beat `walk`, about 2–3 s. Shown as a subtitle by the app; the clip itself carries no text.

**Prompt:**

> Flat paper-cut 2D animation in the exact style of the reference image: thick dark-navy ink outlines (#1E2A3A),
> flat colour fills, no gradients, no textures, soft kit ground shadow only. Warm cream and pale sky background
> (#F6EFE0). The same honey-coloured mascot dog as in the reference image (coat #E8B26A, darker ears and back legs
> #B9783A, light belly #F6E3C0) wearing a green harness, and the same person as in the reference image (red-orange
> top, navy trousers, dark hair). Gentle, slow, calm motion like a cut-out puppet animation. Locked side-view camera,
> no zoom, no pan. One idea per clip.
> Scene: a pavement with a tree and a bush. 0 to 3 seconds: the person and the dog walk slowly to the right together,
> the green leash hanging low in a relaxed smile-shaped curve; near the end of these seconds the person glances down
> at the dog and visibly says one short word (lips move once, calm friendly face; silent, no speech bubble, no text). 3 to 6 seconds: still walking, the person lowers one
> hand holding a small brown treat to the side seam of their trousers, at the height of the dog's mouth. 6 to 8
> seconds: the dog steps in, takes the treat right beside the person's leg, and keeps walking close to the leg; the
> leash is still curved and loose. The treat is given at the leg, never held out in front of the dog.
> Avoid: any text, letters, numbers, subtitles, speech bubbles or signs with writing; logos; anything that needs
> speech or sound to understand; photorealism; 3D rendering; camera shake, zoom or cuts; extra animals or people
> unless listed; leash pops, jerks, yanking or any harsh correction; the dog looking scared or in pain.

**Target timeline** (save as `docs/content/animations/smile-leash.json` until the clip is measured):

```json
{
  "version": 1,
  "duration": 8,
  "beats": [
    {"id": "walk", "start": 0, "end": 3},
    {"id": "treat", "start": 3, "end": 6},
    {"id": "take", "start": 6, "end": 8}
  ],
  "lines": [
    {"id": "bien", "start": 2.0, "end": 3.0, "voice": "marker"}
  ]
}
```

**Acceptance checks:**

- The leash stays curved for the whole clip.
- The treat arrives at the trouser seam, not in front of the dog's nose.
- They keep walking; nobody stops.
- The Person's lips move once while the leash hangs in a smile, before the treat (Line `bien`), inside the timeline's `bien` range.

## marking-rewarding

- **Lesson:** `marking-rewarding`, Marcar y recompensar (Day 4)
- **Caption:** Primero la marca, después el premio
- **Idea:** the mark comes first, with still hands; the treat comes after.
- **Starting image:** `assets/lessons/marking-rewarding-anim.png`
- **Timeline** (target times; beat ids as in the timeline):
  - `look`, 0–3 s: the dog sits and looks up at the person, whose hands stay still at their sides.
  - `mark`, 3–6 s: a soft ring pulse appears near the person's mouth (the marker; no text); the hands are still still.
  - `treat`, 6–8 s: only then the hand goes to the pocket and gives the treat to the dog.
- **Lines:** «bien» (`bien`, `voice: marker`), in beat `mark`, about 3.2–4.4 s. Shown as a subtitle by the app; the clip itself carries no text.

**Prompt:**

> Flat paper-cut 2D animation in the exact style of the reference image: thick dark-navy ink outlines (#1E2A3A),
> flat colour fills, no gradients, no textures, soft kit ground shadow only. Warm cream and pale sky background
> (#F6EFE0). The same honey-coloured mascot dog as in the reference image (coat #E8B26A, darker ears and back legs
> #B9783A, light belly #F6E3C0) wearing a green harness, and the same person as in the reference image (red-orange
> top, navy trousers, dark hair). Gentle, slow, calm motion like a cut-out puppet animation. Locked side-view camera,
> no zoom, no pan. One idea per clip.
> Scene: a grassy park with a tree. 0 to 3 seconds: the dog sits facing the person and looks up at their face; the
> person stands with both hands completely still at their sides. 3 to 6 seconds: a single soft yellow ring pulses
> outward from near the person's mouth, like a gentle sound wave, as the person visibly says one short word
> (lips move once, calm friendly face; silent, no speech bubble, no text); both hands stay still. 6 to 8 seconds: only
> after the ring has faded, the person's hand moves to the trouser pocket, takes out a small brown treat and gives it
> to the dog, who stays sitting. The ring is a plain shape, not a speech bubble and not a letter.
> Avoid: any text, letters, numbers, subtitles, speech bubbles or signs with writing; logos; anything that needs
> speech or sound to understand; photorealism; 3D rendering; camera shake, zoom or cuts; extra animals or people
> unless listed; leash pops, jerks, yanking or any harsh correction; the dog looking scared or in pain.

**Target timeline** (save as `docs/content/animations/marking-rewarding.json` until the clip is measured):

```json
{
  "version": 1,
  "duration": 8,
  "beats": [
    {"id": "look", "start": 0, "end": 3},
    {"id": "mark", "start": 3, "end": 6},
    {"id": "treat", "start": 6, "end": 8}
  ],
  "lines": [
    {"id": "bien", "start": 3.2, "end": 4.4, "voice": "marker"}
  ]
}
```

**Acceptance checks:**

- The hands do not move at all until the ring has appeared.
- The ring is a plain shape: no letters, no speech bubble.
- The order (look → ring → hand → treat) is unmistakable.
- The Person's lips move once with the ring pulse, hands still (Line `bien`), inside the timeline's `bien` range.

## sniffing-decompression

- **Lesson:** `sniffing-decompression`, Olfatear y descomprimir (Day 5)
- **Caption:** Deja que elija el rumbo para olfatear
- **Idea:** on a loose leash the dog chooses where to sniff, and you wait.
- **Starting image:** `assets/lessons/sniffing-decompression-anim.png`
- **Timeline** (target times; beat ids as in the timeline):
  - `zigzag`, 0–3 s: loose leash in a quiet park with hedges; the dog zig-zags nose-down.
  - `linger`, 3–6 s: the dog lingers at a bush while the person waits still.
  - `walk-on`, 6–8 s: the dog lifts its head, looks at the person, relaxed, and they walk on.
- **Lines:** none; the Person stays silent (the timeline holds beat times only).

**Prompt:**

> Flat paper-cut 2D animation in the exact style of the reference image: thick dark-navy ink outlines (#1E2A3A),
> flat colour fills, no gradients, no textures, soft kit ground shadow only. Warm cream and pale sky background
> (#F6EFE0). The same honey-coloured mascot dog as in the reference image (coat #E8B26A, darker ears and back legs
> #B9783A, light belly #F6E3C0) wearing a green harness, and the same person as in the reference image (red-orange
> top, navy trousers, dark hair). Gentle, slow, calm motion like a cut-out puppet animation. Locked side-view camera,
> no zoom, no pan. One idea per clip.
> Scene: a quiet park with green hedges and bushes. 0 to 3 seconds: the leash hangs loose; the dog wanders slowly in
> a gentle zig-zag with its nose to the ground, choosing its own direction, and the person follows a step or stays
> put. 3 to 6 seconds: the dog stops at a bush and sniffs it for a while; the person waits, standing still and
> relaxed, the leash still loose. 6 to 8 seconds: the dog lifts its head, looks back at the person with a soft,
> relaxed face, and they walk on together slowly.
> Avoid: any text, letters, numbers, subtitles, speech bubbles or signs with writing; logos; anything that needs
> speech or sound to understand; photorealism; 3D rendering; camera shake, zoom or cuts; extra animals or people
> unless listed; leash pops, jerks, yanking or any harsh correction; the dog looking scared or in pain.

**Target timeline** (save as `docs/content/animations/sniffing-decompression.json` until the clip is measured):

```json
{
  "version": 1,
  "duration": 8,
  "beats": [
    {"id": "zigzag", "start": 0, "end": 3},
    {"id": "linger", "start": 3, "end": 6},
    {"id": "walk-on", "start": 6, "end": 8}
  ],
  "lines": []
}
```

**Acceptance checks:**

- The leash never goes tight.
- The person does not hurry the dog away from the bush.
- The mood is unhurried from start to end.

## Measure the timings

Veo does not keep to the times in a prompt, so the stored timeline is measured from the accepted clip.

1. Open Gemini (the app or Google AI Studio) with a model that can watch video. Attach the exported `<key>.mp4`.
2. Paste the prompt below, then the entry's **target timeline** JSON in place of `<target timeline>`.

   > This silent 8-second animation was made from the timeline below. Watch the attached video and measure when each
   > beat and each line actually happens. A beat is a step of the action described by its id. A line is the moment the
   > person's lips move to say the word named by its id; there is no sound and no text, judge from the mouth. Return
   > the same JSON: keep every id, every "voice", the order and the structure exactly as they are, and change only
   > "start", "end" and "duration" to the times in the video, in seconds, rounded to 0.1. Beats must not overlap and
   > must stay in order; every time must be between 0 and the duration. Answer with the JSON only, no other text.
   >
   > `<target timeline>`

3. Save the answer as `docs/content/animations/<key>.json` and run `npx jest src/shell/lessons`: the conformance test
   rejects a malformed file, changed ids or Lines.
4. Scrub check, by a person: open the clip in a player that shows the time, jump to each Line's `start` and `end`
   and to each beat boundary, and confirm the mouth moves inside the Line's range and each beat starts where the
   action does. Fix the numbers by hand if needed.

## Export and upload

1. Export the chosen take as MP4 and re-encode it silent, 720p wide, web-ready (stays well under the 5 MB limit):

   ```sh
   ffmpeg -i in.mp4 -an -c:v libx264 -crf 26 -preset slow -movflags +faststart -vf scale=1280:-2 <key>.mp4
   ```

   Check that it is at most 15 s and at most 5 MB (`ls -lh <key>.mp4`).
2. Run the timing prompt on `<key>.mp4` ("Measure the timings") and save the result to
   `docs/content/animations/<key>.json`; `npx jest src/shell/lessons` must pass.
3. Upload **both files** to the public Supabase Storage bucket `lesson-media`, folder `animations/`, as
   `animations/<key>.mp4` and `animations/<key>.json`, with `cache-control: max-age=3600`. In the dashboard: Storage →
   `lesson-media` → `animations` → Upload, with "Cache control" set to `3600`. With the CLI or API, pass
   `cacheControl: '3600'` and `upsert: true`.
4. To replace a clip, overwrite both objects (same key): a new clip always gets its newly measured timeline. Users
   get them within the hour, with no app release. A **new** key, or a new Line, needs a `lessonMedia.ts` entry or
   catalog keys (and for a key, a poster), so it ships in a release.
5. Open the Lesson in a build with `EXPO_PUBLIC_MEDIA_BASE` set (README, "Lesson Animations") and play the clip; check
   that each subtitle appears with the Person's word.
6. When it passes every check, remove it from [stand-in-content.md](stand-in-content.md).
