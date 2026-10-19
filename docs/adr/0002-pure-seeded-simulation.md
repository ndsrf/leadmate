# Keep the simulation pure, fixed-step and seeded

The simulation logic is plain TypeScript stepped at a fixed rate in simulation time, with every random choice drawn from a seeded generator, and it is separate from Phaser rendering. Terms follow `GLOSSARY.md` (Stage, Handler, Dog, Drive, Disengagement). The same seed and inputs therefore always produce the same Stage and the same debrief payload, which makes tests, replays and a daily shared level possible. Using the renderer's clock or `Math.random` in the simulation is not allowed.
