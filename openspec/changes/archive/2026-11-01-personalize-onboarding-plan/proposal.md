# Proposal

## Why

Onboarding asks which Distractors make the Dog react, then shows a "Personal Plan" that nothing reads afterwards: `onboarding.plan` is stored and displayed on the plan card, and `nextPlanned` is never called. Every user also gets the same taste Stage (another dog walking at them) and the same World 1 start, so an owner whose real problem is biting at home is shown a reaction-to-dogs scene first. The questionnaire also ignores the problems owners most often have at home (barking, destroying things, eating socks, biting) and the Dog's age and sex, which change what is safe and sensible to teach first.

## What Changes

- Add a "main concerns" question (pick up to 3, most worrying first) and a home-behaviour concern checklist to onboarding: biting the owner, biting other people, barking at home, destroying things, eating non-food things (socks), plus the existing outdoor reactions (dogs, children, bicycles, skateboards, food).
- Add Dog age (puppy under 6 months, adolescent 6-18 months, adult, senior; asked as a band) and Dog sex (male, female) to Dog setup and the Dog record.
- Ask the Main Concern right after the Dog's name and look, before the Taste Stage (a single tap, recorded in a new ADR 0019 that narrows ADR 0010). The Taste Stage stays a leash Stage for everyone; its Distractor kind and Payoff wording follow the Main Concern (the approaching dog when none is set).
- Replace `buildWalkPlan` with a prioritiser that turns concerns, intensity, age and sex into an ordered list of existing Stretches (Lessons, Nodes, Missions), with safety first: biting ranks above everything else, then eating objects, then the rest by the user's main concern.
- Make the plan do something: the World Map's "next up" and a "Start here" marker follow the plan, and the plan card explains each pick in terms of the user's answers ("Because {name} bites hands, we start with...").
- Age only reorders the plan (puppy moves the at-home Stretches up, adolescent moves the Poste practice up). Sex is used for pronouns in plan text only; skipping either is allowed and gives "they".
- Two derived, non-blocking notes on the plan card (never stored): a professional-help note when either biting Concern is level 2 or 3, and a supervision-and-distance note when reacting to children is level 3.
- A "Home Behaviours" section on the World Map with one Stretch per Home Behaviour, collapsed and marked "not a concern for {name}" while its level is 0. It stays tappable, a "this is a concern now" action sets level 1, and it is excluded from completion, unlocks and progress counts unless it is a Concern (then it counts toward its own progress only). Its Stretches are "coming soon" placeholders until the follow-up change `add-home-behaviour-training` supplies the Lessons and exercises.
- A content coverage test with an explicit `KNOWN_GAPS` list so the missing Home Behaviour content cannot be forgotten.
- Existing users keep their record; missing fields default so their plan is rebuilt only when they open settings and edit the answers.

## Capabilities

### New Capabilities
- `dog-concerns-plan`: the Dog's concern profile (main concern, behaviour concerns, age band, sex) and the pure prioritiser that turns it into an ordered, explained plan of existing Stretches.

### Modified Capabilities
- `onboarding-funnel`: new questions, new funnel order (Main Concern before the taste), Distractor and Payoff matched to the Main Concern, plan card driven by the prioritiser.
- `dog-trigger-profile`: the questionnaire and settings editor also cover the home-behaviour concerns, age and sex.
- `world-map-screen`: next-up and a "Start here" marker follow the Personal Plan; a collapsible Home Behaviours section.

## Impact

- Code: `src/shell/dogRecord.ts` (new fields, record migration, defaults), `src/shell/onboarding/{plan,questionnaire,flow,taste,setup}.ts`, `src/shell/screens/{SetupScreen,PlanScreen,WorldMapScreen,SettingsScreen}.tsx`, `src/shell/world.ts` (next-up), `src/shell/onboarding/diagnostic.ts` (`recordDiagnostic` builds the plan), i18n keys for all supported languages.
- Persistence: Dog record version bump with a migration that defaults the new fields.
- Content: no real Lessons or Nodes in this change. Barking, destroying and eating objects have none today; placeholders and a coverage test track the gap, and `add-home-behaviour-training` (proposal only, created with this change) is where the content gets planned.
- Docs: ADR 0019; `GLOSSARY.md` already updated (Concern, Home Behaviour, Main Concern, Personal Plan).
- Out of scope: new training content, changing World unlock rules, the Diagnostic, the paywall, the guided first Stage's content.
