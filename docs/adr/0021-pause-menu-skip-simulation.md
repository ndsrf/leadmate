---
status: proposed
---
# Pause Menu Exit Skips Stage with Completion Credit

When a Stage, Close Exercise, or Daily walk is paused, selecting the secondary action in the Pause Menu skips the active simulation and advances directly to its Debrief or results screen with 1-star completion credit, rather than abandoning progress and returning to the World Map. Furthermore, the Stage view now provides an on-screen back button in the top-left safe area so the Pause Menu is accessible across all platforms and touch devices.

## Considered Options

- **Abandon to World Map without progress (before):** Selecting Exit threw the user back to the map with the Node uncompleted, forcing players to replay simulations in full even if they experienced device difficulty or wished to advance.
- **Three-button Pause Menu (Resume, Skip, Abandon):** Added a third action to the Pause Menu. Rejected to keep the dialog uncluttered and directly address the user's need to advance past the simulation.
- **Skip with baseline 1-star credit (chosen):** Synthesizes a valid neutral baseline debrief payload (`durationSeconds: 30`, `slackPercentage: 100`, `handlingScore: 500`) that unlocks trail progression without undeserved higher stars (≥650) and leaves the Dog's persistent Learning Attributes untouched.

## Consequences

Players on touch devices and iOS can comfortably pause via the on-screen back button. Exiting the Pause Menu unlocks downstream trail nodes and registers completion without corrupting the Dog's learned behavioral profile or telemetry aggregates.
