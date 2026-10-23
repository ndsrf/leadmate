# Preview Worlds as Roadmap Teasers

The World Map defines extended curriculum Worlds (Worlds 5–8: *El Parque y la Llamada*, *Terrazas y Cafeterías*, *Senderos y Naturaleza*, *Tráfico y Multitudes*) as preview roadmap entries (`Preview World` / `Plus World`) before authoring their simulation scenarios. Each preview World includes topic subtitles and planned node counts, displaying upcoming training stages and gating access behind LeadMate Plus. Tapping locked Plus worlds or nodes navigates directly to `PaywallScreen`.

## Considered options

- **Hide upcoming worlds until simulation stages are built:** keeps `WORLDS` 1:1 with executable stages, but leaves new users with the impression that LeadMate only contains 4 short worlds (11 nodes), reducing motivation to subscribe. Rejected; showcasing curriculum breadth from day one builds user trust and establishes long-term value.
- **Stub executable dummy simulations for Worlds 5–8:** allows stages to load, but requires placeholder physics scenarios that do not teach real canine mechanics. Rejected; preview cards with topic summaries set clear expectations without compromising simulation quality.
- **Render a separate roadmap tab:** isolates previews from the World Map, but breaks the single-journey winding trail concept of Board 11. Rejected.

## Consequences

- `WorldDef` supports `topics: TextKey`, `tier: 'free' | 'plus'`, and `preview: boolean`, and `MapWorld` exposes these to the UI.
- Sequential progression remains unbroken: completing earlier Worlds is still required, with Plus status acting as an additional gate once reached.
- Progression calculators (`allComplete`, completion percentages) evaluate completed nodes against playable content while preview nodes indicate roadmap status.
