# Spec Delta

## MODIFIED Requirements

### Requirement: Inline embedded video
The system SHALL play a Lesson video block in place, inside its block, without leaving the screen, from either of two sources: a hosted Lesson animation or a YouTube video. Playback SHALL start only on user action and SHALL NOT contact the media host or the video host until the user asks.

#### Scenario: Play a video
- **WHEN** the user taps play on a Lesson video block
- **THEN** the video loads and plays inside the block and the rest of the Lesson stays scrollable

#### Scenario: Not loaded until asked
- **WHEN** a Lesson with a video is opened
- **THEN** only a bundled poster with a play control and the caption is shown, plus a "Plays from YouTube" label on YouTube blocks, and no request is made to any media or video host (not for the clip, and not for its timeline)

#### Scenario: YouTube plays on a phone
- **WHEN** the user taps play on a YouTube block in the native app
- **THEN** the embed plays and does not show a player configuration error (YouTube "Error 153")

#### Scenario: Animation plays silently and loops
- **WHEN** the user taps play on an animation block
- **THEN** the clip plays inline, without sound, loops, and pauses or resumes when tapped

#### Scenario: Subtitles follow the clip
- **WHEN** an animation with Lines is playing, paused or looping
- **THEN** the subtitle shown always matches the clip's current playback time

#### Scenario: App leaves the foreground
- **WHEN** the app goes to the background while a Lesson video plays
- **THEN** the video pauses and stays paused until the user plays it again

#### Scenario: Offline or failed embed
- **WHEN** the video cannot load because the device is offline, the clip is missing or the video is unavailable
- **THEN** the block shows the themed placeholder with a retry action and the Lesson remains readable and completable

#### Scenario: Open a YouTube video elsewhere
- **WHEN** a YouTube block has been started
- **THEN** it offers an "Open video" action that opens the video address in the system browser; animation blocks offer no such action

#### Scenario: Unsupported platform
- **WHEN** the platform cannot embed a YouTube video
- **THEN** the block offers an "Open video" action that opens the video address in the system browser

### Requirement: Only allow-listed video sources embed
The system SHALL load into a Lesson video player only an animation address or animation timeline address built from the configured media base or an embed address on the privacy-enhanced YouTube host, and SHALL treat any other address as not playable.

#### Scenario: Malformed id
- **WHEN** a YouTube video id is not exactly 11 characters of letters, digits, "_" or "-"
- **THEN** it is not embedded and the placeholder is shown

#### Scenario: Fixed parameters
- **WHEN** a YouTube video is embedded
- **THEN** the address is built only from the video id, the app's fixed origin and fixed parameters; nothing else from the data is added

#### Scenario: Unknown host
- **WHEN** a video item points to a host that is neither the media base nor the allow-listed video host
- **THEN** it is not loaded and the placeholder is shown

#### Scenario: Foreign address as an animation key
- **WHEN** an animation block's data holds a full web address instead of a key
- **THEN** nothing is loaded and the placeholder is shown
