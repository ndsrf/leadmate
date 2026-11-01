# Design

## Context

See proposal.md. Today `App.tsx` renders `<SimView key={attempt} …/>` unconditionally as the first child of the root, with every shell screen drawn over it as an `absolute inset-0` view. The bundle is told to `suspend` (Phaser loop sleeps), which stops frames but not the WebView process, its compositor layer, or its timers. `App.tsx` also has a `bundle` state (`loading`/`ready`/`error`), a `bundleReady` ref, a `pendingStart` ref (a `start` posted before ready is replayed on `ready`), and a load-timeout effect that runs from app launch while `bundle === 'loading'`. `retry()` already remounts the view by bumping `attempt`.

The World Map's `NextUpRing` uses a Reanimated `withRepeat(..., -1)`, which keeps the UI thread producing frames for as long as the map is live. Barkdoku's only timer is a 250 ms ticker that re-renders at most once a second.

## Goals / Non-Goals

**Goals:**
- Nothing Stage-related is alive while the player is on shell screens.
- No infinite animation on the resting World Map.
- Evidence: before/after numbers that separate Expo Go dev overhead from real cost.

**Non-Goals:**
- Changing the Stage's render loop, 30 fps cap, or scenery (already specified).
- Reworking minigame animations or ads.
- Adding a new native dependency.

## Decisions

1. **Mount the Stage view on demand, derived from route/flow state.** A single `stageViewWanted` value drives rendering `<SimView>`. It turns true when the player enters a Node flow that contains a Stage (at its Primer or Checkpoint step, so the load hides behind reading time), or opens the Daily, taste, first-run or warm-up flow, and false when the Stage ends, is quit, or the flow is left. On false the view unmounts and `bundleReady`/`bundle` reset to `loading`. It is never true on the World Map or in a Minigame. The released view is not kept through the Debrief; Play again mounts a fresh one. Only Nodes with no `minigame` mount it, including ones that also carry a `scenario` field (e.g. `harness-ritual`, `doorbell-mat`, the Barkdoku Node), which are Minigames. Leaving the flow at any step releases the view and clears the pending start. A load failure before the Stage begins gets one silent remount; the error and retry screen shows only if the view is still not ready when the Stage needs it. Flows with no Primer (Daily, taste, first-run, warm-up) show the loading overlay on a cold mount; if that is visibly slow on the first-run taste Stage, use the hide fallback for that flow only. Recorded in ADR 0019.
   *Alternatives:* (a) keep it mounted but 0×0 or `display:none` — still holds the web content process on iOS/Android and is the cheapest to ship but the least certain to cool the phone; (b) pause JS via `injectedJavaScript` — does not release the compositor layer. Unmounting is the only option that truly frees it. **Rule (decided):** if a cold mount reaches ready in under about 1 s on the Android reference phone, unmount; otherwise hide the view (0×0, loop asleep) instead. If measurement shows (a) gives the same drop, (a) is also acceptable.

2. **Reuse the existing pending-start path.** `startStage` already stores a message in `pendingStart` when the bundle is not ready; after mount-on-demand this becomes the normal path rather than the rare one. The `suspend`/`wake` messages on AppState changes only apply when a view exists.

3. **Gate the load timeout** on `stageViewWanted && bundle === 'loading'`, so it neither fires on shell screens nor fails a view that was never created.

4. **Bound the Next Up pulse in the animation itself**: `withRepeat(withTiming(1,{duration:1100}), N, false)` with N=4 (about 4.4 s), then settle at the static ring; restart on `pulse`/`live` changes or Next Up change, which already re-run the effect. This keeps it on the UI thread with no JS timer. *Alternative:* drop the pulse entirely under thermal pressure — no reliable API in Expo Go.

5. **Measure with a production-like build** using `expo start --no-dev --minify` (works in Expo Go) alongside the dev run, plus the existing dev readout where relevant. Record in `docs/`.

6. **Separate display power from app load.** Baselines run at fixed 50% brightness and include one Dark-appearance run. If Dark cools the phone noticeably on an OLED screen, report it as a finding for the owner (a possible default or a hint); changing the default theme is not part of this change.

7. **World Map scroll cost is measured before it is changed.** The map renders every world and node in one `ScrollView`. Task 3.2 profiles scroll and first render; only if it is significant, restrict heavy row parts (SVG glyphs, shadows) to rows near the viewport, using the scroll offset already tracked in a ref (no new state per scroll event). *Alternative:* convert to `FlatList`/`SectionList` — larger rewrite, and it risks the scroll-to-Next-Up logic that depends on measured offsets, so it is not chosen.

8. **Acceptance is a hard result, not just a table.** In a production-like build, the World Map and Barkdoku read near-idle UI-thread activity when static, and the phone shows no noticeable warming over 15 minutes at fixed brightness. If Expo Go dev mode still reads high, that is reported separately and does not fail the change.

## Risks / Trade-offs

- [Inline bundle string is re-parsed on every remount, which could make Stage start slow] → measure load time in task 1; if slow, use the hide-instead-of-unmount fallback in Decision 1.
- [Off-screen row optimisation could flicker or break scroll-to-Next-Up] → only done if profiling justifies it, and covered by the existing map scroll tests.
- [First Stage is slower to appear because the bundle must load] → the loading overlay and `pendingStart` already cover it; measure load time in task 1 and keep it under about a second, else prefer the 0×0 fallback in Decision 1.
- [Race: `start` posted before the new view mounts, or a stale `ready` from an unmounted view] → key the view per mount (`attempt`), ignore messages from an old key, reset refs on unmount; cover with a test.
- [Warm-up/taste/first-stage flows relied on a view that was always there] → include them in `stageViewWanted`; test each starts a Stage from cold.
- [Expo Go dev overhead may remain after fixes] → the baseline separates it, so the result is reported honestly and not a regression.
- [Bounded pulse reduces the "tap me" cue] → the static dashed ring remains and the pulse re-plays when the map is revisited.
