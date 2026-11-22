# Spec Delta

## Purpose

Lets owners find and follow real-world games to play with their own dog, delivered as Content so new games arrive without an app release, with one free sample game and the rest of each game gated behind Plus.

## ADDED Requirements

### Requirement: Dog Games are Content
The system SHALL deliver every Dog Game as an item of the active Content Pack, so adding, editing, reordering or retiring a game needs no app release. A Dog Game is a real-world activity played with the user's real dog and is distinct from a Minigame played with the virtual Dog.

#### Scenario: Game added by content update
- **WHEN** a content update that adds a game is activated
- **THEN** the game appears in the Games list without an app update

#### Scenario: Game retired by content update
- **WHEN** a content update removes a game that the user had opened before
- **THEN** the game no longer appears in the Games list and nothing else in the app is affected

### Requirement: Game fields
Each Dog Game SHALL have a stable id, a title, an intro, an ordered list of steps, and one or more illustrations with alt text. It MAY have materials, tips, a safety note, a difficulty, an approximate duration, a Free flag and a video reference. Text SHALL be per language with Spanish as the required fallback.

#### Scenario: English text missing
- **WHEN** a game has no English text and the user's language is English
- **THEN** the game is shown in Spanish

#### Scenario: Optional fields absent
- **WHEN** a game has no materials, tips or video
- **THEN** its detail omits those sections without leaving an empty heading

### Requirement: Games screen
The system SHALL provide a Games screen with a "random game" button at the top and, below it, the list of games in content order. Each list row SHALL show the game's title, a small illustration and, when present, its duration and difficulty, and SHALL show a Plus marker on a game that is not Free while the user is not Plus.

#### Scenario: Open the list
- **WHEN** the user opens the Games screen
- **THEN** the random button is the first element and every game of the pack is listed below it in content order

#### Scenario: Open a game from the list
- **WHEN** the user taps a row
- **THEN** that game's detail opens

#### Scenario: Plus marker
- **WHEN** a Free user views a game row for a game that is not Free
- **THEN** the row shows the Plus marker, and a Plus user sees no marker

### Requirement: Random game
The "random game" button SHALL open the detail of one game chosen at random from the list. It SHALL NOT pick the game opened by the previous random press when the list holds more than one game, and SHALL include games that are not Free.

#### Scenario: Random pick
- **WHEN** the user presses the random button
- **THEN** the detail of one game of the list opens

#### Scenario: No immediate repeat
- **WHEN** the user presses the random button twice in a row and the list has several games
- **THEN** the second pick is a different game from the first

#### Scenario: Only one game
- **WHEN** the list has exactly one game
- **THEN** the random button opens that game

### Requirement: Free sample and Plus gate on the detail
The detail of a game SHALL show to everyone its title, its first illustration and its intro. For a game that is not Free, a user who is not Plus SHALL see the remaining content (materials, steps, tips, further illustrations, shop links, video) replaced by blurred-looking placeholder bars with a Plus button over them. A Plus user, and everyone on a game flagged Free, SHALL see the whole game.

#### Scenario: Free user on a Plus game
- **WHEN** a Free user opens a game that is not Free
- **THEN** the title, first illustration and intro are readable, the rest is replaced by placeholder bars, and a Plus button is shown over them

#### Scenario: Plus user
- **WHEN** a Plus user, including one on an active trial, opens any game
- **THEN** the whole game is shown with no placeholder and no Plus button

#### Scenario: Free sample game
- **WHEN** any user opens the game flagged Free
- **THEN** the whole game is shown

### Requirement: Hidden content is not rendered or announced
The gated part of a game SHALL NOT be drawn as its real text or images, and SHALL be hidden from screen readers; the Plus button SHALL be the only gated element announced, with a localized label that says the rest of the game needs Plus.

#### Scenario: Screen reader on a locked game
- **WHEN** a screen reader reads a locked game
- **THEN** it reads the title, intro and the Plus button, and no gated steps or materials

### Requirement: Plus button opens the paywall and returns to the game
Pressing the Plus button SHALL open the paywall. When the user starts the trial or subscribes there, the system SHALL return to the same game with its whole content shown; when the user leaves the paywall without Plus, it SHALL return to the same game still locked.

#### Scenario: Trial started from a game
- **WHEN** a Free user presses the Plus button on a locked game and starts the trial
- **THEN** the same game opens fully unlocked

#### Scenario: Paywall dismissed
- **WHEN** the user closes the paywall without becoming Plus
- **THEN** the same game is shown still locked

### Requirement: Shop links on a game
A game MAY name Shop targets (a Product, Subcategory or Category) that it needs, each with a short note. The detail SHALL show each target with the existing "see in the shop" action that opens the Shop at that target. A target that does not exist in the active pack, or that the Shop hides for the user's language, SHALL NOT be shown, and the game SHALL stay fully usable.

#### Scenario: Link to a subcategory
- **WHEN** a Plus user opens the snuffle-mat game that targets the snuffle-mat Subcategory and taps "see in the shop"
- **THEN** the Shop opens at that Subcategory

#### Scenario: Missing target
- **WHEN** a game names a target id that the pack does not contain
- **THEN** that link is not shown and the rest of the game is unaffected

### Requirement: Safety note
A game that uses tools or objects a dog could swallow or chew (fabric, plastic, Kong pieces, bones) SHALL carry a safety note shown in its materials section that tells the owner to supervise the dog and to use pieces larger than the dog's mouth.

#### Scenario: Game with a swallowable object
- **WHEN** a game declares a safety note
- **THEN** the note is shown in the detail with the materials, and the pack validator flags a game that declares an object kind needing one but has none

### Requirement: Game illustrations travel with the pack
Every Dog Game illustration SHALL be a wordless 16:9 image stored in the game's own `media/` folder of the pack and delivered with the content. The illustrations of the games in the stable pack at build time SHALL also be bundled in the app as a fallback, and an installed pack copy SHALL take precedence over the bundled one. An illustration that is neither installed nor bundled, or that fails to load, SHALL show the themed media placeholder and SHALL NOT block reading the game.

#### Scenario: Bundled illustration shows offline
- **WHEN** the device is offline on first launch and opens a game that was in the stable pack when the app was built
- **THEN** its illustration is shown from the app bundle

#### Scenario: Offline before the first download
- **WHEN** the device is offline and the illustration of a game added after the app was built has not been downloaded
- **THEN** the themed placeholder is shown in its place and the game text remains readable

#### Scenario: Illustration limits
- **WHEN** a game illustration is not 16:9, is larger than the size limit, or is larger than the weight limit
- **THEN** content validation fails and names the file and the limit it breaks

### Requirement: Alt text for every illustration
Every game illustration SHALL have alt text in the game's language text, and content validation SHALL fail for an illustration without alt text in Spanish.

#### Scenario: Missing alt text
- **WHEN** a game declares an illustration with no Spanish alt text
- **THEN** content validation fails and names the game and the illustration

### Requirement: Games entry is hidden without games
The Games entry on the World Map SHALL be visible only while the active Content Pack contains at least one game.

#### Scenario: Pack without games
- **WHEN** the active pack has no games
- **THEN** the World Map shows no Games chip

#### Scenario: Pack with games
- **WHEN** the active pack has at least one game
- **THEN** the World Map shows the Games chip

### Requirement: Games analytics
The system SHALL record screen views of the Games screen and the game detail, and the use of the random button, using the app's existing analytics contract and without sending the game's text or the user's dog data.

#### Scenario: Random pressed
- **WHEN** the user presses the random button
- **THEN** one random-pick event is recorded with the picked game id and the user's Plus status
