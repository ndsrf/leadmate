# Dog Games content backlog

The first release ships the 6 games of the artboard "Juegos con tu perro — primer lote" in the LeadMate Design
System canvas. The author will add more games later; each new game is a folder in `content/<channel>/games/` and
needs no code change. Add a row under "Next games" when a game is planned.

## First batch (shipped with release 1.4.0)

Content in `content/beta/games/<id>/`. Families are inferred from each game's idea in the artboard captions.

| # | Id | Family (inferred) | Materials | Shop link |
| --- | --- | --- | --- | --- |
| 1 | `eleccion-mano` | Impulse control / choice | Kibble | none |
| 2 | `manta-enrollada` | Scent | Old blanket, kibble | none |
| 3 | `pienso-a-oscuras` | Scent | Kibble | none |
| 4 | `manta-buscadora` | Scent | Snuffle mat, kibble | Subcategory `mantas-olfativas` |
| 5 | `trilero` | Impulse control / choice | Three plastic cups, kibble | none |
| 6 | `escalon-azul` | Body awareness / tricks | Low step, treats | none |

## Next games

| # | Working title | Family | Materials | Needs shop link? |
| --- | --- | --- | --- | --- |
| - | (none planned yet) | | | |

## Ideas for later games

- The object kit of the artboard also draws a cone (`cono`), an egg carton (`huevera`), a food ball (`bola-comida`) and a Kong with a piece (`kong-y-trozo`). They suggest later games but are not confirmed as list entries.
- The proposal names a snuffle mat, a cone and a Kong as products that games would recommend.

## Authoring rules for each new game

- Follow `content/FORMAT.md` section "Dog Game Sections" and the voice and method rules of `docs/content/lesson-guide.md`.
- A game with `fabric`, `plastic` or `bone` materials needs a `## safety` section; a Kong game states a piece larger than the dog's mouth and supervision.
- Illustrations: 16:9 wordless PNG, ≤ 960 px wide, ≤ 250 KB, with Spanish alt text.
- Shop links only to targets that exist; real buy links come from the author.
