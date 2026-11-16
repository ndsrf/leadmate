# readable-dog spike (tasks 1.1-1.3)

Results are recorded in `../design.md` (Decision 3 and Risks). This folder holds the evidence.

- `rdog-walklook-contact-sheet.png`: the test pose (walk with the head turned to the Handler) in the 8 facings. It is cut from the packed atlas in a light, golden and black coat, plus one row at about phone size.
- `rdog-atlas/`: the packed spike atlas (`rdog_walk*`, `rdog_walklook*`, 64 frames), made with `pack-sprites.py --sets rdog`. It is not the shipped atlas.
- `estimate-atlas/`: today's shipped atlas with its 72 Cube Pet frames replaced by a 240-frame stand-in for the new Dog's full clip set, to measure size and load time (task 1.3).

## Reproduce

The Kenney downloads directory is only needed for the shipped jobs. The spike jobs read `scripts/kenney/models/`, so any directory will do for the first argument.

```sh
node scripts/kenney/render-sprites.mjs <downloads> <raw> rdog rdogest   # spike jobs only
python3 scripts/kenney/pack-sprites.py <downloads> <raw> <rdog-atlas> --sets rdog
python3 scripts/kenney/pack-sprites.py <downloads> <raw> <est-atlas> --sets rdogest
python3 scripts/kenney/spike/atlas-estimate.py bundle/assets/kenney <est-atlas> <full-atlas>
node scripts/kenney/spike/atlas-load-time.mjs shipped=bundle/assets/kenney estimate=<full-atlas> --runs 30
python3 scripts/kenney/spike/contact-sheet.py <rdog-atlas> <out.png>
node --test scripts/kenney/*.test.mjs
```

## Left for a person (Android test device)

- 1.2: view the packed `walklook` frames in a Stage on the device, in all 8 directions. Today this needs a temporary switch of the Dog's frame names in `bundle/src/StageScene.ts`, which `rd-sprite` will do properly. Judge whether the look-back reads at the walk zoom, especially in facings 45 and 225.
- 1.3: load a Stage with `estimate-atlas/` in place of `bundle/assets/kenney/sprites.{png,json}` on the low-end device. Compare the Stage load time and memory with today's atlas.
