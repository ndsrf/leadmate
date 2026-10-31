# Implementation notes

## Integration check (task 6.1), 2026-10-31

Run against the Expo web build (`npx expo start --web -c`) with Playwright at 390 × 844, seeding the Dog record in
`localStorage` (`leadmate.dog`), the same way `scripts/capture-controls.mjs` does.

- **New user.** A version 8 record just past the funnel (onboarding `done`, no trail progress) opens the map on
  "Mundo 1 · Un perro es un perro", 0 of 11 Stops, with "Tiene nombre" as the only open Stop, marked "Siguiente".
  "Mundo 2 · Casa y umbrales" shows "Completa el mundo anterior para abrir este." and its Stops are locked.
  Shortcut: the record was seeded at the end of the funnel instead of walking through every funnel screen.
- **Dog as a dog Minigame.** With the three Stretch 1 Lessons read, the Node opens from the map, its Primer and
  Checkpoint run, and the living-room scene shows the four buttons (Ignorar, A su cama, Marcar, Achucharlo).
  Picking Achucharlo makes the Dog jump, shows "Ese no era" and the hint "Cogerlo, achucharlo o besarlo lo excita
  más: lo tratas como a un peluche, no como a un perro."
- **Existing user.** A version 7 record with the Harness Ritual done (2 stars) loads with World 1 complete, World 2
  showing the same progress as before (harness Stretch done, its Mission next-up), no celebration and no page errors.
  Home keeps its wainscoting backdrop and house landmark (`environmental-backdrop-home`, `top-landmark-home`); World 1
  draws the dog-bed landmark.

## Deviations from the plan

- The World title template is `'Mundo {n} · {title}'`, not `'Mundo {n} · {name}'` as design decision 2 and task 1.1
  wrote: the app's translator fills `{name}` with the Dog's name, so the map header read "Mundo 1 · Migas". Found in the
  integration check; `world.test.ts` now guards it.
- Home Missions also swap the brief heading ("Tu misión en casa", `mission.brief.title.home`), so the brief is not
  headed "Tu misión de paseo". The spec asks for the brief to be worded for home; the design only named the check-in
  question.
- Go Sniff is gated by `FIRST_WALKING_WORLD = 3` in `src/sim/sim.ts`, and every Stage scenario's `world` moved up by
  one, so Worlds 1 and 2 (the static ones) never offer it.
- The Basics Node titles keep the existing `Mundo N · …` pattern of Node titles, and every other Node title was
  renumbered by one.
