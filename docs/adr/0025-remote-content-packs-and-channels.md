---
status: accepted
---
# Remote Content Packs, Channels, and In-App Activation

Educational content (Worlds, Lessons, Nodes, Missions, and their visual assets) was previously compiled into TypeScript source modules (`src/shell/world.ts`, `lessons.ts`, `nodes.ts`, `missions.ts`, and `es*.ts`). Modifying an illustration, fixing a typo, reordering a trail stop, or adding a new Lesson required a full native app release through the App Store and Google Play tracks.

We decouple curriculum content from application code by introducing Content Packs: plain YAML and Markdown file structures organized into two release channels (`beta` and `stable`), built into content-addressed immutable storage and served over Supabase Storage with in-app verification, caching, and atomic activation.

## Considered Options

- **Hardcoded TypeScript content (status quo):** Keeps zero network dependencies, but ties educational iteration to app binary release cycles. Rejected.
- **Headless CMS API with dynamic runtime fetching:** Allows live editing, but requires constant network access, complex caching layers, and breaks offline gameplay on walks. Rejected.
- **Static Content Packs with dual channels and bundled baseline (chosen):**
  - Content items live as plain data files in `content/<channel>/` (`pack.yaml`, `worlds/`, `lessons/`, `nodes/`, `missions/`).
  - Strict validation (`content:validate`) prevents dangling references, missing Spanish baseline text, broken scenarios, and unretired deleted IDs.
  - Builds (`content:build`) produce a deterministic, compatibility-checked `manifest.json` and hashed files in `dist/content/<channel>/files/<sha256>.<ext>`.
  - The stable channel is bundled directly into the app binary as the **Baseline Pack**, ensuring full offline functionality and instant zero-network first runs.
  - Publishing (`content:publish`) uploads files, writes versioned manifests, and points `<channel>/latest.json` last. Service-role permissions stay on author machines and are never bundled in client code.
  - The app downloads updates in the background, validates them with the identical engine before activation, and switches only at the next launch (or immediately via deliberate tester channel switch in Settings).

## Consequences

- Authors and AI agents can edit curriculum in plain Markdown and YAML without touching TypeScript or app logic.
- Content packs contain pure data; raw HTML markup is rejected to eliminate remote injection risks.
- Dog progress remains intact: progress references stable IDs only, beta-only completions are safely ignored on stable, and retired IDs preserve existing Stars and completion records.
- Developers and testers can switch between `stable` and `beta` content in Settings via a 7-tap unlock on the version label.
