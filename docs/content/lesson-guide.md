# Writing a theory Lesson

How to write the theory Lessons of the Library and the trails, their illustrations and the Checkpoint questions that
test them. A Lesson is plain data (`theoryLesson()` in `src/shell/lessons/content.ts`); its words live in the Spanish
catalog (`src/i18n/es.ts` for the first week, `src/i18n/es.trail.ts` for the trails) and its pictures in
`scripts/art/lessons/`. `src/shell/lessons/conformance.test.ts` checks every Lesson that is not `placeholder` against
the rules below.

## Voice

- Speak to the reader as **tú**: warm, calm, concrete. A friend who trains dogs, not a manual.
- Short sentences. One idea per paragraph. Prefer verbs to nouns ("frena" over "realiza una detención").
- No jargon without a gloss: the first time a term appears ("refuerzo", "umbral", "marcar"), say what it means in
  plain words in the same sentence.
- The dog in the examples is the reader's own: write `{name}` and the app fills in the Dog's name, or "tu perro" when
  it has none (capitalised at the start of a sentence). The Dog may be male or female and the app does not ask, so a
  text with `{name}` uses no word that agrees with the Dog: say what it does ("se sienta", "se tumba", "con calma",
  "en tensión", "junto a tu pierna") instead of how it is ("sentado", "tranquilo", "tenso", "pegado"), and repeat the
  name rather than "él". Words that agree with something else ("el arnés", "el cuerpo rígido") are fine; generic "tu
  perro" stays masculine, as elsewhere in the app. Never quote the name as something said (`«{name}»` would read
  «tu perro»): write "dices su nombre". `i18n.test.ts` checks the common cases.
- The reader is "tú"; never assume their gender: no adjective that agrees with the reader ("quieto", "tranquilo",
  "listo"); say what they do instead ("sin moverte", "te paras", "con calma").
- Name what the reader will feel ("es normal que al principio tarde minutos") so they do not give up.
- No exclamation marks in the body; the tip may have one.

## Method rules (non-negotiable)

LeadMate teaches reward-based handling in the spirit of **LIMA** (least intrusive, minimally aversive):

1. Reinforce what you want: mark the right moment and pay it (food, sniffing, moving on). Never punish what you do not
   want; make it not pay instead (stop, wait, take distance).
2. **No** corrections, leash pops, jerks, "no" shouted, scruffing, alpha rolls, spray bottles, shake cans, prong,
   choke or shock collars. Do not mention them even as "don't do this" in the do / don't block: the "don't" side is a
   common, well-meant mistake (moving on while the leash is tight, repeating the cue, rewarding too late), never abuse.
3. Welfare first. A dog that is overwhelmed cannot learn: "si dudas, más distancia". Give an exit (turn around, leave,
   end the session) in every Lesson that deals with triggers.
4. Explain behaviour by learning and emotion (habit, expectation, excitement, fear), never by dominance, spite or
   "testing you".
5. Promise progress, not miracles: say how long it usually takes and what a good first step looks like.
6. Safety: no tips that put the dog, the person or others at risk (no wrapping the leash round the hand, no letting go
   near traffic).

## The pattern

Every theory Lesson has these sections, in this order; `theoryLesson()` emits it, so authors fill keys, not layout.
Under the Lesson's prefix (`lesson.<n>` or `trail.<id>`):

| Block | Keys | What it says |
| --- | --- | --- |
| heading + text | `heading`, `hook` | The problem the reader recognises, in their words ("Tira en cuanto ve la puerta abierta"). 40-70 words. |
| "Por qué pasa" + text | `why` | The behaviour science in plain words: what the dog learned, what it feels, why the usual reaction makes it worse. 60-110 words. |
| image 1 | `image.1.alt`, `image.1.caption` | The concept diagram (leash shapes, body signals, positions). |
| "Cómo hacerlo" + steps | `step.1` ... `step.n` | 3-6 numbered steps, each one action the reader can do, 12-30 words. |
| example | `example.title`, `example.text` | The worked example (recipe below). 60-110 words. |
| image 2..n | `image.<n>.*` | A scene or sequence: what the example looks like. |
| "Errores comunes" + do / don't | `do`, `dont` | One common mistake (`dont`) and its fix (`do`), each 15-40 words. Optional art per side. |
| video (optional) | `video.alt`, `video.caption` | Only where a relevant video exists; stand-ins keep the placeholder badge. |
| tip | `today` | "Prueba hoy": one small, concrete thing to try on the next walk. 15-35 words. |
| takeaways | `takeaway.1` ... `takeaway.n` | 2-4 one-line summaries, each 5-15 words. |

The title (`title`) stays short (2-6 words); the section headings ("Por qué pasa", "Cómo hacerlo", "Errores comunes")
are shared catalog keys.

### Word bounds

The reading text (headings, including the shared section headings, hook, why, steps, example, do / don't, tip,
takeaways; not captions or alt text) is **350-700 words**, aiming for 420-550. Reading time is computed from it (180 words per minute plus 10 s per image,
30 s per video), so never write minutes by hand.

### Worked example recipe

One paragraph, present tense, in this order:

1. **Who and where**: `{name}` and "tú" in a named, ordinary place ("la esquina de la panadería", "el portal").
2. **What the dog does**: the trigger and the first sign (ears forward, weight on the front legs, the leash
   straightening).
3. **What you do**: the steps of the Lesson, by name, with the timing ("en cuanto", "antes de").
4. **What happens**: the dog's response and the reward, and how the next repetition is a little easier.

Keep it realistic: one hiccup is fine ("la primera vez tarda"), a miracle is not.

## Illustrations

Each Lesson has **at least two** illustrations (image blocks and do / don't art both count): one concept diagram and
one scene or do / don't pair. Every picture shows **one** idea from the text and its caption names that idea.

### Style rules

- SVG in `scripts/art/lessons/<lesson-id>-<n>.svg` (or `-do` / `-dont`), `viewBox="0 0 640 360"`.
- Build from the kit in `scripts/art/lessons/_kit/kit.svg` with `<use href="#dog-walk"/>` and friends: the same Dog
  (drawn as the app's mascot, whatever the reader's Dog looks like) and Person in every Lesson. Position with `transform="translate(x y)"`, mirror with `scale(-1 1)`, size
  with `scale()`; do not redraw the cast.
- Colours: only the palette of `src/shell/ui/tokens.json` (`color`, `mascot`, `coat`); the render script rejects
  anything else. Ink outlines (`stroke` ink, 2.5-4 wide), flat fills, no gradients, no shadows other than the kit's
  ground shadow.
- **No words** in the picture (no `<text>`): meaning comes from shapes, arrows, check / cross badges and numbers in
  circles. Words go in the caption, which is localised.
- Legible at **320 pt** wide (half size): key shapes at least ~24 px in the 640 canvas, outlines at least 2.5 px, no
  fine detail that carries meaning.
- Right versus wrong is told by the check / cross badges (`#badge-check`, `#badge-cross`), never by colour alone.
- Frame the cast large: scale the Person and Dog group 1.1-1.3 in a single scene (a Lesson picture shows at about
  280 pt wide on a phone). Two-panel diagrams split at x = 320 with a dashed ink line and scale each side 0.8-0.9.
- Use `#sky` (no sun) when the corners carry badges or arrows, `#backdrop` (with sun) for plain scenes,
  `#backdrop-indoor` at home.
- Leashes: with the Dog 200 to the right of the Person, `#leash-u`, `#leash-j`, `#leash-taut` (walking hand) and
  `#leash-still-u`, `#leash-still-taut` (Poste stance) join hand and harness exactly. Any other leash is the same
  path drawn twice: `stroke="#1E2A3A" stroke-width="8.5"`, then `stroke="#6FAF73" stroke-width="4.5"`, round caps.
- Put the caption and alt keys on the root element (`data-caption="…" data-alt="…"`); the contact sheet reads them.
  A do / don't picture names its `do` / `dont` key in both.
- Preview every symbol: `node scripts/lesson-art-sheet.mjs --kit` (or `--kit dog- person` for some).

### Shot list

Write the shot list before drawing; review it together with the text. One entry per picture:

```
<lesson-id>-<n>  (concept | scene | do | dont)
  shows:    the one idea, in a sentence
  kit:      dog-pull, person-still, leash-taut, badge-check, ...
  layout:   who is where, what points at what
  alt:      what a screen reader says (what it shows)
  caption:  the idea it names (what it means)
```

### Rendering and review

```
node scripts/render-lesson-art.mjs            # SVG -> assets/lessons/*.png + lessonArtRegistry.ts
node scripts/render-lesson-art.mjs <name>     # one picture
node scripts/lesson-art-sheet.mjs             # contact sheet: every picture, caption and a 320-pt copy
```

Look at the PNGs (not the SVG source) at 320 pt before calling a picture done.

The How-to-play Lessons show captures of the real controls instead of drawings. `scripts/capture-controls.mjs` stages
each one (fixed seed, scripted input, fixed date), rings the control and writes `assets/lessons/howto-<lesson>-<n>.png`
into the same registry; their caption and alt are the Lesson's `c<n>` keys. It needs both dev servers
(`npm run sim:dev` and `npx expo start --web`; pass `--app <url>` for another port). Re-run it whenever a control's
look changes, and keep the How-to-play text to what the screen actually shows.

## Checkpoint questions

Each trail Node asks three questions on the theory Lesson just before it, keys
`node.<slug>.tq<n>.{question,right,wrong1,wrong2,why}` in `es.trail.ts`.

- The three questions test **three different points** of the Lesson: typically the why, a step (timing or order) and
  the common mistake. Never three wordings of one point.
- Every answer is in the Lesson text; a reader who read it carefully gets 3 of 3.
- Distractors are **plausible real mistakes**, ideally from the Lesson's "don't" side or a misreading of a step; never
  jokes, never "Ninguno" or "No hace falta", never an aversive method.
- Options have **similar length** (the longest is at most ~1.5 times the shortest) and the same grammatical form, so
  the right answer is not the longest or the only precise one.
- Questions are short (at most ~60 characters); options at most ~50 characters, so three fit a phone screen.
- `why` is one sentence: why the right answer is right, in the Lesson's words. The Debrief shows it after a miss.
- Author the right answer first (`right`); the screen shuffles the order every time.

## Per-Lesson brief (for an author or a subagent)

The pilots (`calm-leash`, `theory-poste`) set the bar; read both, in the catalog and on the contact sheet, before
starting. One Lesson per author; Lessons can be written in parallel because each touches only its own keys and files.

**Setup** (in a worktree of its own)

- Reset the worktree to the commit the brief names (`git reset --hard <sha>`) and check that
  `scripts/art/lessons/_kit/kit.svg` exists.
- Link the dependencies (`ln -s <main checkout>/node_modules node_modules`) and copy the gitignored
  `src/shell/simHtml.generated.ts` from the main checkout, so `tsc` passes. Commit neither.
- Run one shell command per call: compound commands (a heredoc followed by `cd`) may be refused in a worktree.

**Inputs**

- This guide, the kit (`scripts/art/lessons/_kit/kit.svg`, previewed with `--kit`) and the two pilots.
- The Lesson's current text (its `lesson.<n>.*` or `trail.<id>.*` keys) and its place: the Day, or the trail Stretch
  and the Node after it.
- For a trail theory Lesson, the Node's Checkpoint keys `node.<slug>.tq1..3.*` and recap `node.<slug>.recap1`.

**Steps**

1. Write the shot list (2-4 pictures, at least one concept and one scene or do / don't pair) and check each picture
   against the text it illustrates.
2. Write the Spanish text into the catalog under the Lesson's prefix, replacing the old `p1` / `p2` / `tip` /
   `image.*` keys: every key of the pattern table, `image.<n>.alt` / `.caption`, and `video.*` only if the Lesson
   keeps its video. Remove the keys the Lesson no longer uses.
3. Draw the SVGs in `scripts/art/lessons/<lesson-id>-<n>.svg` (and `-do` / `-dont`), render them with
   `node scripts/render-lesson-art.mjs <names…>`, and **look at the PNGs** (open them) at full size and at 320 pt on
   the contact sheet (`node scripts/lesson-art-sheet.mjs <lesson-id>`). Fix and re-render until each picture shows its
   one idea clearly at 320 pt and nothing overlaps (badges, sun, arrows).
4. Switch the Lesson in `src/shell/lessons/content.ts` to `theoryLesson(id, { keys, images, steps, takeaways,
   compare?, video?, day? })`, still with `placeholder: true` (a person removes it after review; the factory marks its images placeholder too).
5. For a trail theory Lesson: rewrite `node.<slug>.tq1..3.*` so each question tests a different point of the new text
   and each `why` uses the Lesson's words; update `node.<slug>.recap1` if the Lesson's core idea changed; point the
   Node's recap card at the Lesson's clearest picture (`recapPrimer(slug, { art: '<name>' })` in
   `src/shell/nodes/content.ts`).
   The game's controls belong to the How-to-play Lessons and the recap's second card (`recap2`): describe what the
   handler does on a real walk, not which button to press, and leave those keys alone.
6. Check: `npx jest src/shell/lessons src/shell/nodes src/i18n` passes and, with `placeholder` removed locally, the
   conformance test passes for the Lesson (then put the flag back).

**Outputs** (all in the change, nothing else touched): the shot list (in the hand-off message), the catalog keys,
the SVG sources, the rendered PNGs and the regenerated `lessonArtRegistry.ts`, the `content.ts` entry, and for trail
Lessons the Checkpoint and recap keys. `lessonArtRegistry.ts` is generated: when merging parallel work, re-run
`node scripts/render-lesson-art.mjs` instead of merging it by hand.

## Placeholder flag

A Lesson keeps `placeholder: true` until its text and pictures are final **and a person has reviewed it** for training
accuracy and tone. Removing the flag puts it under the conformance test and hides its placeholder badges; a stand-in
video keeps its own badge (`video: { id, placeholder: true }`).
