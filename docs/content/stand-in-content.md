# Stand-in content

What the app ships that is not final yet. No badge marks it in the app any more (the "Provisional" badges are gone),
so this list is the only record. **An item leaves the list when it is final**: its text and pictures are reviewed by a
person for training accuracy and tone, or, for a clip or video, when it passes its checks. Edit this file in the same
change that makes an item final.

## Missions and Fixes

Every Mission is still stand-in: its brief text (`mission.<slug>.*` in `src/i18n/es.trail.ts`) and every Fix (the
`fix.<slug>.<problem>.*` keys). No Fix illustration is drawn yet: each Fix names `fix/<slug>/<problem>`, which is not
bundled, so its image block shows the themed placeholder. Missions are in `src/shell/missions/content.ts`.

| Mission | Title | Fixes (`fix/<slug>/<problem>`; `general` is "Otra cosa") |
| --- | --- | --- |
| `mission-dog-as-dog` | Un día como perro | `cries`, `family`, `bed`, `general` |
| `mission-home-rest` | La casa tranquila | `insists`, `barks`, `comesback`, `general` |
| `mission-calm-first` | Primero, calma | `neverstops`, `escalates`, `givein`, `general` |
| `mission-harness` | El arnés en casa | `excited`, `runs`, `bites`, `general` |
| `mission-doorbell` | El simulacro del timbre | `barks`, `door`, `mat`, `general` |
| `mission-poste` | El poste en la escalera | `pulls`, `pulled`, `long`, `general` |
| `mission-walk` | Cinco minutos con una distracción | `fixates`, `pulls`, `lunges`, `general` |
| `mission-corners` | Las esquinas de tu barrio | `ahead`, `surprise`, `forget`, `general` |
| `mission-u-leash` | Un paseo en U | `lost`, `zigzag`, `treats`, `general` |
| `mission-leave-it` | Déjalo en la acera | `grabs`, `ignores`, `repeat`, `general` |
| `mission-shields` | Escudos en tu calle | `late`, `sees`, `nocar`, `general` |
| `mission-cue-choice` | La señal justa | `mixup`, `toomuch`, `nothing`, `general` |
| `mission-park-jogger` | Corredores en el parque | `chases`, `tangle`, `surprise`, `general` |
| `mission-park-mix` | El parque lleno | `overwhelmed`, `food`, `me`, `general` |

The `<slug>` of each Fix is the Mission's catalog slug: `dogasdog`, `homerest`, `calmfirst`, `harness`, `doorbell`, `poste`, `walk`, `corners`, `uleash`,
`leaveit`, `shields`, `cuechoice`, `jogger`, `parkmix`.

The three Basics World Missions are Home Missions (`place: 'home'`): their check-in asks
`mission.checkin.question.home` and their brief is headed `mission.brief.title.home`. Their copy was drafted with the
Basics World and has not been reviewed yet.

## Basics World Lessons and Nodes

The Basics World ("Un perro es un perro") was drafted in one pass and still needs a review for training accuracy and
tone, especially against the no-physical-correction rule of the `dog-basics-world` spec. Text in
`src/i18n/es.trail.ts` (`trail.<id>.*`, `node.<slug>.*`), Minigame text in `src/i18n/es.ts` (`minigame.affection.*`,
`minigame.rest.*`, `minigame.calm.*`, `minigame.hint.cuddle`, the new `minigame.action*`, `minigame.dog.*` and
`minigame.cue.*` states).

| Item | Kind | Pictures |
| --- | --- | --- |
| `theory-named-behaviours` | Theory Lesson "Tiene nombre" | `theory-named-behaviours-1`, `-2` |
| `theory-dog-as-dog` | Theory Lesson "Un perro, no un peluche" | `theory-dog-as-dog-1`, `-2`, `-do`, `-dont` |
| `howto-choose-action` | How-to-play Lesson "Elegir la acción" | captures `howto-choose-action-1`, `-2` |
| `theory-home-rest` | Theory Lesson "En casa se descansa" | `theory-home-rest-1`, `-2` |
| `theory-calm-first` | Theory Lesson "Primero, calma" | `theory-calm-first-1`, `-2` |
| `dog-as-dog`, `home-rest`, `calm-first` | Node recaps, Checkpoints and exercises (`node.dogasdog.*`, `node.homerest.*`, `node.calmfirst.*`) | — |

The tap card of `howto-tap-hold` was shortened to a reminder, since tapping is now taught in `howto-choose-action`.
None of the Basics Lessons has a Lesson Animation or a YouTube video yet.

## Home Behaviour training

Added by `add-home-behaviour-training`; all of it needs a review for training accuracy and tone, and the biting and
eating-objects Lessons and Missions need the named safety review (task 6.2 of the change) before they leave this list.
Text in `src/i18n/es.home.ts`. None of the Lessons has a Lesson Animation or a YouTube video.

| Item | Kind | Pictures |
| --- | --- | --- |
| `theory-bite-owner` | Theory Lesson "Si te muerde a ti", leads with the professional-help note | stand-ins `body-language-1`, `theory-dog-as-dog-1` |
| `theory-bite-others` | Theory Lesson "Si muerde a otras personas", leads with the professional-help note | stand-ins `body-language-2`, `theory-visual-shields-1` |
| `theory-bark-home` | Theory Lesson "Ladra en casa" | stand-ins `theory-calm-first-1`, `-2` |
| `theory-destroy` | Theory Lesson "Destroza cosas" | stand-ins `theory-home-rest-1`, `-2` |
| `theory-eat-objects` | Theory Lesson "Se come lo que no es comida", leads with the vet note (`lesson.note.vet`) | stand-ins `theory-leave-it-1`, `-2` |
| `bark-home`, `destroy`, `eat-objects` | Exercise Nodes (read-the-Dog scenes) with recaps and Checkpoints (`node.barkhome.*`, `node.destroy.*`, `node.eatobjects.*`) and Minigame text (`minigame.<scene>.*`) | recap pictures `theory-calm-first-1`, `theory-home-rest-2`, `theory-leave-it-1`; the five new Dog states (`barking_window`, `barking_at_you`, `chewing_object`, `eyeing_item`, `holding_item`) reuse the existing Dog drawing with their own pose |
| `mission-bite-owner`, `mission-bite-others`, `mission-bark-home`, `mission-destroy`, `mission-eat-objects` | Home Missions with Fixes (`fix/<slug>/<problem>` is not drawn: `biteowner`, `biteothers`, `barkhome`, `destroy`, `eatobjects`; problems as in `missions/content.ts`, plus `general`) | none yet |

The pictures of the five Lessons are existing illustrations used as stand-ins (their captions and alt texts describe
the idea, not the picture); each needs its own drawing following [lesson-guide.md](lesson-guide.md).

## Puppy Track companion lessons

Added by `puppy-track-and-early-onboarding`; companion Satellite Stops in World 1 for puppy records. Text in `src/i18n/es.trail.ts`. All three Lessons borrow existing illustrations as stand-ins and need dedicated drawings following [lesson-guide.md](lesson-guide.md) before leaving this list.

| Item | Kind | Pictures |
| --- | --- | --- |
| `puppy-bite` | Theory Lesson "Inhibición del mordisco y dientes de aguja" | stand-ins `body-language-1`, `theory-dog-as-dog-1` |
| `puppy-sound` | Theory Lesson "Desensibilización sonora" | stand-ins `theory-calm-first-1`, `theory-home-rest-1` |
| `puppy-vet` | Theory Lesson "Manipulación corporal y veterinario" | stand-ins `calm-leash-1`, `body-language-2` |

## YouTube videos still wanted

A Lesson's YouTube video must be spoken in the user's language: `lessonMedia.ts` keys each id by language, and a
Lesson with no video in the active language shows none (never one in another language). The Spanish videos of
`calm-leash` (`8Ba10_ycocY`), `body-language` (`76DSS5xNwtk`) and `smile-leash` (`VgnWd0Yu_Rk`) were approved on
2026-10-31. These Lessons still have no Spanish video; adding one is an `es` id in `lessonMedia.ts` plus the Lesson's
`video.alt` / `video.caption` keys, checked against the method rules of [lesson-guide.md](lesson-guide.md)
(reward-based, no corrections or aversive tools):

| Lesson | Wanted |
| --- | --- |
| `marking-rewarding` | Marking a behaviour and then rewarding it (clicker or a marker word), in Spanish |
| `sniffing-decompression` | A sniffing / decompression walk on a loose leash, in Spanish |

## Lesson Animations

Each clip stays here until it is generated, uploaded to `lesson-media/animations/<key>.mp4` and passes the shared and
per-entry acceptance checks of [lesson-animation-prompts.md](lesson-animation-prompts.md). Until it is uploaded, a
build with a media base shows the retry placeholder for it after the tap.

| Key | Lesson | State |
| --- | --- | --- |
| `calm-leash` | Lo básico de un paseo tranquilo | not generated |
| `body-language` | Leer el lenguaje corporal | not generated |
| `smile-leash` | La correa en sonrisa | not generated |
| `marking-rewarding` | Marcar y recompensar | not generated |
| `sniffing-decompression` | Olfatear y descomprimir | not generated |
