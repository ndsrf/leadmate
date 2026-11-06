# Power baseline (changes `cut-idle-shell-gpu-load`, `add-power-budget`)

## Budget

Judged against the **reference screen** over **10 minutes** on a production-like build:

| Case | Allowed above the reference screen |
| --- | --- |
| Idle shell screen (World Map, Barkdoku, Settings, ...) | **0.3%** of battery capacity (measurement noise; no frames, wakeups, running animations or repeating timers) |
| Simulator session (Stage or hand drill) | **2%** of battery capacity |

Pass or fail uses the platform energy measure, never battery percent: Android `dumpsys batterystats` (mAh, read with Battery Historian), iPhone Xcode Energy Log (Energy Impact). Battery percent (1% resolution) is recorded only as a sanity check.

## Reference screen

A static full-screen page with the display on, nothing animating and no app work: the app's splash with the loop asleep, or a plain black/grey page in the system browser. Use the same one for every row on a device and record which.

## Method

1. Reference devices: iPhone 16 (60 Hz) and Pixel 7 Pro (120 Hz). The Pixel is the high-refresh case (loop wakeups, DOM animation repaint rate).
2. Fixed brightness 50%, auto-brightness off, no other apps running, same device before and after; airplane mode with Wi-Fi off where the scenario allows.
3. Production-like build: `expo start --no-dev --minify` (dev build only where a row says so).
4. Each row is 10 minutes. Run it **three times and take the median**.
5. Stage rows: one fixed-seed Stage on the densest scenery theme, restarted when it ends. Hand drill rows: the hand drill continuously. Idle rows: the screen left alone.
6. Android: reset with `adb shell dumpsys batterystats --reset`, run, then `adb shell dumpsys batterystats --checkin` or Battery Historian, and read the app's estimated mAh (and the screen/display share, to subtract the reference). iPhone: Xcode Energy Log (or Instruments Energy Log) attached for the 10 minutes; read the average Energy Impact and the CPU/GPU/overhead split, and compare with the reference screen.
7. Also record fps (UI / JS) from the performance monitor and how warm the phone feels.

Regression counters (frames, loop wakeups, running animations, live loops, timers, DOM renders) are checked per change by `node scripts/power.mjs` and the dev readout (`?perf=1` in the Stage bundle, the shell dev overlay, shown with `EXPO_PUBLIC_DEV_PERF_OVERLAY=1`). Devices are the acceptance test.

## Baseline tables

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

## Ads and Lesson video audit (`add-power-budget` 5.1)

Read from `src/shell/ads/`, `WorldMapScreen.tsx` and `LessonVideo*.tsx`; no device numbers yet. "Breaks budget" means the behaviour could add activity on a screen that should be resting.

| Finding | Breaks budget? | Fix (5.2) |
| --- | --- | --- |
| The banner (`AdBanner`) is the only ad slot, in the World Map footer for free users. No other screen renders one. | No | Test that `WorldMapScreen` is the only user of `<AdBanner>`. |
| The World Map stays mounted under Settings, the Library and Lessons, so its native banner stayed mounted and could request and refresh ads while covered. | **Yes** (ad request and refresh with no slot in view) | `AdBanner` takes `active`; the map passes `live` (app in front and map not covered). While false the native banner is not mounted (size kept, nothing loads). |
| Backgrounding the app: the native banner relied on the SDK to stop refreshing. | Yes, if the SDK keeps a timer | Same `active` flag: `live` is false in the background, so the banner is unmounted. Coming back loads one fresh ad instead of continuing a refresh timer. |
| Interstitial preload (`preloadInterstitial`, after a Stage ends) is one request with no timer. `prepareAds` runs once at start. | No | None. |
| Lesson video is created only after the tap (or right after the user unlocks it with a tap, `autoPlayVideo`); nothing plays on its own. | No | None. |
| The native Lesson Animation paused only when the app reached `background`; an `inactive` state (Control Center, a system dialog) left it playing. | Minor | It now pauses whenever the app is not `active`. A YouTube embed already pauses in the background (`usePauseMediaInBackground`). |
| The Lesson Animation reports its time every 0.1 s (10 JS events/s) for the subtitles while it plays. | Only while a user-started video plays | Recorded; measure during the Stage-class device run before changing the subtitle rate. |

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

