# Proposal

## Why

`personalize-onboarding-plan` lets owners report Home Behaviours (biting the owner, biting other people, barking at home, destroying things, eating things that are not food), but the app has no dedicated Lessons, exercises or Missions for them. Until it does, those owners get "coming soon" placeholders and the nearest existing material. These owners are the ones who most need the app, so this content must not be dropped; a coverage test with a `KNOWN_GAPS` list fails CI until each gap is closed.

## What Changes

- Write a theory Lesson, a choose-the-action Node and a real-world Mission for each Home Behaviour, one Stretch each, shown only as needed by the Home Behaviours map section.
- The biting Stretches lead with the professional-help note and teach safe handling first.
- Remove each Home Behaviour from `KNOWN_GAPS` as its content lands.
- Open questions to settle before design: which behaviours share a Stretch (biting the owner vs other people), how eating objects is split between training and vet advice, and who reviews the content for safety.

## Capabilities

### New Capabilities
- `home-behaviour-training`: Lessons, Nodes and Missions for each Home Behaviour and how they appear in the Home Behaviours map section.

### Modified Capabilities

## Impact

- Content in `src/shell/lessons`, `src/shell/nodes`, `src/shell/missions`, the `WORLDS` data and i18n for all supported languages.
- Depends on `personalize-onboarding-plan` (Concern model, Home Behaviours section, coverage test).
- Proposal only: design, specs and tasks come when this change is picked up.
