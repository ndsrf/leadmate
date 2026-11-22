# World 7 read-through checklist (task 4.6)

Rules checked per file, ES and EN: no paying begging, no corrections (wrong answers that name a correction are labelled wrong and explained), an exit wherever triggers appear, no legal claims (access: "ask the venue"), second-person tú voice, `{name}` and Dog vocabulary from GLOSSARY.md.
`pass` = read, no change needed. `fixed` = changed during review.

| File | Result |
|---|---|
| content/beta/lessons/theory-cafe-setup/{es,en}.md | pass (asks the venue about dogs; exit in step 5) |
| content/beta/lessons/theory-cafe-settle/en.md | fixed: hook said "a snout" / "stop it"; now "their snout" / "stop the begging" |
| content/beta/lessons/theory-cafe-settle/es.md | pass (begging never paid; exit in step 5) |
| content/beta/lessons/theory-cafe-waiters/{es,en}.md | pass (exit in why, step 5, takeaways) |
| content/beta/lessons/theory-cafe-leave-early/{es,en}.md | fixed: "pay inside or later" read as leaving without paying; now "pay at the counter with {name} beside you" |
| content/beta/lessons/theory-cafe-*/lesson.yaml | pass |
| content/beta/missions/mission-cafe-short-visit/{es,en}.md | pass (asks the venue; exit in nomat c2) |
| content/beta/missions/mission-cafe-settle/{es,en}.md | pass (do not give in; exit in up c2) |
| content/beta/missions/mission-cafe-waiters/{es,en}.md | pass (change tables / shorten; ask the venue) |
| content/beta/missions/mission-cafe-leave-early/{es,en}.md | fixed: same "pay later" line as the Lesson |
| content/beta/missions/mission-cafe-*/mission.yaml | pass |
| content/beta/nodes/cafe-arrive/{es,en}.md | pass (wrong answers "repeat louder" / "rush" are explained; venue reminder) |
| content/beta/nodes/cafe-settle/{es,en}.md | pass (feeding is never the answer; exit in tq3) |
| content/beta/nodes/cafe-passing-dog/{es,en}.md | pass (scold / pull-back options are wrong answers with a why; exit in tq1 and debrief) |
| content/beta/nodes/cafe-*/node.yaml | pass |
| content/beta/worlds/cafe.yaml, cafe/{es,en}.md | pass |
| src/i18n/en.ts `minigame.cafe.*` | pass |
| src/i18n/es.ts `minigame.cafe.*`, `minigame.terrace` | fixed: "alfombra" -> "manta" to match the Lessons and Nodes |
| src/i18n/{es,en}.ts `world.cafe.preview`, `world.cafe.topics` | not used by any screen (the World loads its topics from `cafe/{es,en}.md`); left as is, stale preview copy |

Guarded by tests: `World 7 terrace content method rules` in `src/shell/lessons/conformance.test.ts`.
