# Proposal

## Why

`personalize-onboarding-plan` lets owners report Home Behaviours (biting the owner, biting other people, barking at home, destroying things, eating things that are not food), but the app has no dedicated Lessons, exercises or Missions for them. Until it does, those owners get "coming soon" placeholders and the nearest existing material. These owners are the ones who most need the app, so this content must not be dropped; a coverage test with a `KNOWN_GAPS` list fails CI until each gap is closed.

## What Changes

- Write a theory Lesson and a real-world Mission for each Home Behaviour, plus an exercise for each except the two biting ones, one Stretch each, shown only as needed by the Home Behaviours map section.
- The biting Stretches lead with the professional-help note and teach safe handling first.
- Remove each Home Behaviour from `KNOWN_GAPS` as its content lands.
- Exercises are minigame-mode Nodes, preferably one shared data-driven choose-the-action view rather than a bespoke minigame per behaviour. The close practice sim view (`Simulator-close-view`) is out of scope: it is a leash drill and none of these behaviours fit it.
- The biting behaviours have no exercise: a simulation that can be failed is the wrong way to teach bite handling, so they are a Lesson and a Mission only.
- Coverage model: the coverage test currently requires a Node for every Home Behaviour, so it changes to let a part be intentionally absent (e.g. a required-parts list per concern) without a permanent known gap.
- Open questions to settle before design: which behaviours share a Stretch (biting the owner vs other people), how eating objects is split between training and vet advice, and who reviews the content for safety. Scoring of the choose-the-action Node is left to design and is not a priority.

## Capabilities

### New Capabilities
- `home-behaviour-training`: Lessons, Nodes and Missions for each Home Behaviour and how they appear in the Home Behaviours map section.

### Modified Capabilities

## Impact

- Content in `src/shell/lessons`, `src/shell/nodes`, `src/shell/missions`, the `WORLDS` data and i18n for all supported languages.
- Depends on `personalize-onboarding-plan` (Concern model, Home Behaviours section, coverage test).
- `src/shell/homeBehaviours.ts` and its test (required parts per concern), the minigame Node plumbing in `src/shell/nodes`, and a new shared exercise view in `src/shell/screens`.
- Specs are placeholders; design and tasks come when this change is picked up.
