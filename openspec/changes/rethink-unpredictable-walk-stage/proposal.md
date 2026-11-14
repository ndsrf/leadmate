# Proposal

> **Status: parked stub.** Captured so the idea is not lost. Not scheduled; no specs, design or tasks yet. Revisit after `add-world-6-recall-and-unpredictable-walks` ships.

## Why

The first Stage that practises Unpredictable Walks (Stretch 1 of World 6) ships with an interim scoring that was judged **not fun enough**: reach the waypoints with little Rigid Pull and a minimum number of Check-ins. It reuses existing measures, so it works, but it does not make the user *want* to vary direction, pace and stops, which is the whole skill.

There is also a rule conflict. Sintonía (`sync-combo`) rewards smooth, continuous arcs and drops when the Handler reverses more than 90° within 0.5 s. A sudden U-turn is exactly what an Unpredictable Walk teaches, so the best play in that Stage breaks the combo, and the Node is exempted from Sintonía.

## What Changes

To be explored, not decided. Candidate directions:

- A scoring or reward loop where a well-timed change of direction, pace or stop earns something visible, for example a Check-in from the Dog right after a turn.
- A turn-quality measure (a turn done with a Slack leash and followed by a Check-in) instead of plain Rigid Pull counts.
- A rule for how Sintonía and sudden turns coexist, or a separate flow state for Unpredictable Walks.
- A Minigame instead of, or beside, the Stage.

Open question to answer first: what would make unpredictable walking feel good to play, and how do we tell by playtest?

## Capabilities

### New Capabilities
<!-- To be decided when the exploration starts. -->

### Modified Capabilities
- `sync-combo`: possibly, if the reversal rule changes. Not confirmed.

## Impact

Probably the simulator scenario config and scoring for World 6 Stretch 1's Node, the Sintonía rules, the Debrief metrics and Stage tuning. Not assessed.
