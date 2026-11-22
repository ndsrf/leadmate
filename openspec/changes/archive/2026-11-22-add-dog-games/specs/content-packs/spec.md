# Spec Delta

## ADDED Requirements

### Requirement: Dog Games are a pack item kind
The Content Pack SHALL hold Dog Games as items under `games/<id>/`, each with a definition file, one text file per language and a `media/` folder, following the same rules as Lessons for ids, per-language text with Spanish fallback and relative media paths.

#### Scenario: Game folder complete
- **WHEN** a game folder holds its definition, a Spanish text file and its media
- **THEN** the pack validates and the game is available to the app

#### Scenario: Duplicate id
- **WHEN** a game id equals the id of any other item in the pack
- **THEN** validation fails and names both items

### Requirement: Dog Game fields are validated
Validation SHALL check each game's definition: required order and Spanish text, a known difficulty value when present, a positive duration when present, shop links that name existing Shop ids, a safety note where the game declares a material kind that needs one, and illustrations that exist in `media/` with alt text. Each error SHALL name the file, the field and a hint.

#### Scenario: Unknown shop target
- **WHEN** a game's shop link names an id that is not a Product, Subcategory or Category of the pack
- **THEN** validation fails and names the game, the field and the unknown id

#### Scenario: Missing illustration file
- **WHEN** a game lists an illustration that is not in its `media/`
- **THEN** validation fails and names the missing file

### Requirement: Game media limits
Validation SHALL reject a game illustration that is not PNG, is not 16:9, is wider than 960 points, or is heavier than 250 KB, and SHALL report the file and the limit it breaks.

#### Scenario: Oversized illustration
- **WHEN** a game illustration weighs more than the weight limit
- **THEN** validation fails and the error names the file, its weight and the limit

#### Scenario: Wrong ratio
- **WHEN** a game illustration is 4:3
- **THEN** validation fails and the error states the required ratio

### Requirement: Format guide covers Dog Games
The format guide for authors and AI agents SHALL describe the `games/` layout, every field, the section headings of the text file and a worked example, and a test SHALL fail when the guide and the schema drift apart.

#### Scenario: Guide drift
- **WHEN** the schema gains a game field that the guide does not describe
- **THEN** the guide-conformance test fails
