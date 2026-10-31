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

The `<slug>` of each Fix is the Mission's catalog slug: `harness`, `doorbell`, `poste`, `walk`, `corners`, `uleash`,
`leaveit`, `shields`, `cuechoice`, `jogger`, `parkmix`.

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
