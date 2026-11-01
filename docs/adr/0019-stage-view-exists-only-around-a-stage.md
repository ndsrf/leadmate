---
status: proposed
---
# The Stage view exists only around a Stage

The Shell used to keep the Phaser WebView mounted under every screen and only put its render loop to sleep, which still left a browser engine and compositor layer alive behind the World Map and Barkdoku and kept the phone warm. The Stage view is now created when a Node flow containing a Stage (a Node with no `minigame`) opens, or when the Daily, taste, first-run or warm-up flow opens, and released when the Stage ends or the flow is left. This refines [ADR 0001](0001-phaser-in-webview.md): the bundle and bridge are unchanged, only the lifetime is.

## Considered Options

- **Keep it mounted, sleep the loop (before):** simplest and instant start, but the idle cost remains.
- **Keep it mounted at 0×0:** cheap to ship, but not certain to free the web content process. Used only if a cold mount takes about 1 s or more on the Android reference phone.

## Consequences

Starting a Stage pays a cold bundle load, hidden behind the Primer and Checkpoint for Node flows and covered by the loading overlay for flows without them. Play again mounts a fresh view. See the `power-efficiency` spec.
