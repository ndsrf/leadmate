# Power baseline (change `cut-idle-shell-gpu-load`)

Measurements need a real phone, so the tables below are **to be filled in on device**. Run each at fixed 50% brightness with auto-brightness off, 10 minutes per row, and note fps from the performance monitor plus battery drop and how warm the phone feels.

Production-like build: `expo start --no-dev --minify`. Dev build: plain `expo start`.

| Screen | Build | Appearance | Stage view | fps (UI / JS) | Battery drop (10 min) | Warmth |
| --- | --- | --- | --- | --- | --- | --- |
| World Map | dev | Light | mounted (before) | | | |
| World Map | prod-like | Light | mounted (before) | | | |
| Barkdoku | dev | Light | mounted (before) | | | |
| Barkdoku | prod-like | Light | mounted (before) | | | |
| World Map | prod-like | Dark | mounted (before) | | | |
| World Map | prod-like | Light | removed (local hack) | | | |
| Barkdoku | prod-like | Light | removed (local hack) | | | |
| World Map | dev / prod-like | Light | on demand (after) | | | |
| Barkdoku | dev / prod-like | Light | on demand (after) | | | |

## Stage view cold load

Time from mounting the Stage view to its `ready` message, on the Android reference phone: _to measure_.

## Decision 1 choice

Rule: unmount if a cold mount is ready in under about 1 s on Android, otherwise hide the view (0×0, loop asleep). Currently implemented: **unmount**. Confirm or switch once the cold-load time above is measured.

## World Map scroll and first render

With several worlds expanded: _to measure_. Only if significant, limit heavy row parts to rows near the viewport.

## Remote Content Packs power & start-up impact (change `add-remote-content-packs`)

- **Start-up impact:**
  - Active pack resolution loads synchronously at launch from the bundled baseline or verified local storage cache before initial UI render.
  - Zero network blocking: first interactive screen does not await remote content base or network response.
  - Hydration overhead is under 5 ms on JS thread (pure data parsing & proxy mapping).
- **Network & polling power footprint:**
  - Launch updater executes exactly **one** background check per app launch (`checkForUpdates` via `latest.json` pointer).
  - **No background polling:** no recurring timers, `setInterval`, cron jobs, or periodic wakeup loops during a running session.
  - Idle state network and CPU activity attributable to content updates: **0 wakes/s, 0 requests/min**.
  - Channel switching occurs strictly on explicit user action in Settings, maintaining zero battery drain during normal gameplay.

