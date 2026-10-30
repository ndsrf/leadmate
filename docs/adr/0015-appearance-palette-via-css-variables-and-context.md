# Appearance Switches Colours Through CSS Variables and a Palette Context, and Light-Only Regions Opt Out Explicitly

App screens follow the device's Appearance, so shell colours can no longer be fixed values decided at build time. There is still one token set per palette.

- **NativeWind classes** compile to CSS variables (`rgb(var(--c-<token>) / <alpha-value>)`). The app root sets those variables with `vars()`.
- **Colours set in code** (inline styles, SVG fills) come from `usePalette()`, which reads a context provided at the same root.
- **The static `color` export is gone**, so code that still imports it fails to compile instead of quietly staying Light.
- **Some regions always stay Light**: a running Stage with every overlay drawn over it, the Splash, each world's header and trail on the World Map, and illustrations of the Dog, the Handler, the scenery and Lesson figures. Their roots render inside `LightRegion`, so classes and `usePalette()` below them read Light. Direct colours import `lightColor` explicitly, and a test limits which files may do so.
- **Colours that carry meaning stay the same in both palettes**: Barkdoku zones, lead tension and arousal.
- **Outlines and offset shadows** use their own `outline` token instead of `ink`. In the Dark palette `ink` is light text.

## Considered Options

- **`dark:` variants on every class**: every `className` needs editing, a missed one is easy to overlook, and it duplicates what the tokens already encode. Rejected.
- **A mutable global `color` object swapped on change**: memoised components and `StyleSheet` caches don't re-render, which leaves light leftovers. Rejected.
- **Illustrations follow the palette**: a cream dog face would turn navy. The art is drawn for one palette. Rejected.
- **Overlays over a running Stage follow Appearance**: dark bubbles over a bright simulation, next to a light HUD. Rejected.

## Consequences

- A new shell component gets its colours from `usePalette()`. Importing `lightColor` is reserved for the Light-only regions above, and each one needs a reason.
- React Native `Modal` mounts a separate root (on web, a portal outside the app root), so its content sits in its own `PaletteRoot`, which re-applies the active `vars()`.
- Pure style helpers (`buttonStyle`, `nodeVisual`, …) take the palette as their first argument, so a call site cannot quietly fall back to Light.
- On a phone set to dark, the Splash stays Light and fades into dark screens. Neither the Splash nor the World Map scenery is darkened yet.
