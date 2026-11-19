# Spec Delta

## MODIFIED Requirements

### Requirement: Format guide for AI agents and authors
The system SHALL ship a format guide beside the content that specifies every file kind, field, allowed value, id rule, where media and video links go, how to add a language, how to reorder, retire and promote content, with a worked example. It SHALL list the starting set of Introduced actions and every action kind a Node can Introduce, and explain that new feedback and Meter Points arrive with the Node that teaches them.

#### Scenario: Agent follows the guide
- **WHEN** an agent writes a new Lesson and Mission following only the guide
- **THEN** `content:validate` passes without errors

#### Scenario: Guide drift is caught
- **WHEN** the set of supported fields, block kinds or Stop kinds in the app differs from the guide
- **THEN** the repository tests fail until the guide is updated

#### Scenario: Action kinds listed
- **WHEN** the set of action kinds a Node can Introduce in the app differs from the list in the guide
- **THEN** the repository tests fail until the guide is updated
