# Spec Delta

## MODIFIED Requirements

### Requirement: Missions in existing progress
For a Dog whose record predates Missions, a Mission SHALL count as passed when it was never started and a Node Stop after it in its World is already completed, or when it is its World's last Mission and every Node Stop of its Stretch was completed before Missions existed. The user SHALL NOT be locked out of content they already reached.

#### Scenario: Returning user
- **WHEN** a user had completed all Nodes of Home & Thresholds (now World 2) before Missions existed
- **THEN** World 2 shows every Mission passed and World 3 is open

#### Scenario: Partly through a World
- **WHEN** a user had completed only the first Node of Home & Thresholds (now World 2)
- **THEN** the Missions after it are not passed, and the first unpassed Mission gates the Stops after it

## ADDED Requirements

### Requirement: Home Missions
A Mission MAY set a target practised at home instead of on a walk. A home Mission SHALL follow every other Mission rule (brief, check-in on a later day, Fixes, gate). Its brief, check-in question and success sign SHALL be worded for home, never for a walk.

#### Scenario: Home Mission brief
- **WHEN** the user opens the Mission of World 1's "En casa se descansa" Stretch
- **THEN** the brief asks them to calmly send the Dog away three times when it asks for attention indoors, with no eye contact, words or touch, and its success sign describes the Dog going to rest on its own

#### Scenario: Home check-in wording
- **WHEN** the check-in of a home Mission opens
- **THEN** the question asks how it went at home, not on the walk
