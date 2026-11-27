# Design

## Context

`App.tsx` keeps the Rusty decision in a `useRef` that is filled on the first render with a loaded record
and cleared only by a progress reset. The warm-up outcome is a separate `useState`. The `AppState`
handler already detects a new App Session with `shouldStartSession`, but only sends analytics.

The warm-up is a time-limited Stage. The simulation clock lives in the Stage bundle, stops while paused
and is not reported to the shell; the HUD draws no time. The bundle also knows nothing of the device's
safe-area insets, which the shell's Stage overlays do. See proposal.md - Why.

## Goals / Non-Goals

**Goals:**
- One owner for the Rusty decision and the warm-up outcome, testable without the whole App.
- The World Map re-renders when the decision changes.

**Non-Goals:**
- A timer in any other time-limited Stage (the Taste Stage, Encounters).
- Which activities move the last-Stage date (ADR 0005 keeps the Daily Stage out of it).
- Clearing Rusty in the middle of an App Session after a graded Stage (unchanged behaviour).
- Deciding again when account sync replaces the record.
- The 72-elapsed-hours gap rule.

## Decisions

1. **A hook, `src/shell/useRustyDog.ts`**, holds both pieces of state and returns `rusty`, `warmup`,
   `setWarmup`, `capacity` and `startSession(record)`. `rusty.ts` stays pure. Alternative: only turn the
   ref into state inside `App.tsx`; rejected, because it can be tested only by rendering the whole App.
2. **State, not a ref**, so a new decision re-renders the map.
3. **App keeps the one background-time detector.** Its existing `shouldStartSession` branch calls
   `startSession`, before and independent of the analytics state check, so analytics being unavailable
   cannot skip it. Alternative: a second `AppState` listener inside the hook; rejected, because two copies
   of "when did we leave" can disagree.
4. **A progress reset calls `startSession(fresh)`** instead of clearing to "undecided", so the result does
   not depend on whether the state update and the record replacement are batched.
5. **The countdown is a shell overlay** in the top row beside the back button, where the Series progress
   strip sits in other Stages. Alternative: draw it in the Phaser HUD; rejected, because without insets it
   would sit under a notch.
6. **The Stage reports the seconds left** in a new `countdown` message, sent only when the whole second
   changes and computed from the simulation clock, so pausing freezes it with no extra state. Alternative:
   a shell timer; rejected, because it would drift from the walk through loading, pauses and slow frames.
7. **A scenario flag (`countdown`)** set by `warmupScenario` turns it on, rather than inferring the
   warm-up from its end condition or Mark budget.

## Risks / Trade-offs

- [A user who warmed up, or did the Daily Stage, is asked again after 30 minutes away] → this is what a
  restart of the app already does, and the stored date is deliberately untouched by both.
- [A new session can start during a Stage] → capacity is read when a Stage starts, so a running Stage and
  its Series snapshot are unaffected.
- [The record is stale when the session starts, before sync brings a Stage from another device] → same as
  at launch today; left out of scope.
- [The hint panel covers the countdown below a tall top inset] → the panel starts below the top row.
