## ADDED Requirements

### Requirement: Inline embedded video
The system SHALL play a video media item in place, inside its card or Lesson block, when its source is a supported video host (YouTube), without leaving the screen. Playback SHALL start only on user action and SHALL NOT load the video host until the user asks.

#### Scenario: Play a video
- **WHEN** the user taps play on a Lesson video block
- **THEN** the embedded video loads and plays inside the block and the rest of the Lesson stays scrollable

#### Scenario: Not loaded until asked
- **WHEN** a Lesson with a video is opened
- **THEN** only a bundled poster with a play control, a "Plays from YouTube" label and the caption is shown and no request is made to the video host

#### Scenario: Offline or failed embed
- **WHEN** the embed cannot load because the device is offline or the video is unavailable
- **THEN** the block shows the themed placeholder with a retry action and the Lesson remains readable and completable

#### Scenario: Unsupported platform
- **WHEN** the platform cannot embed the video
- **THEN** the block offers an "Open video" action that opens the video address in the system browser

### Requirement: Only allow-listed video sources embed
The system SHALL embed only addresses on an allow-listed video host and SHALL treat any other address as not embeddable.

#### Scenario: Malformed id
- **WHEN** a video id is not exactly 11 characters of letters, digits, "_" or "-"
- **THEN** it is not embedded and the placeholder is shown

#### Scenario: Fixed parameters
- **WHEN** a video is embedded
- **THEN** the address is built only from the video id and fixed parameters; nothing else from the data is added

#### Scenario: Unknown host
- **WHEN** a video item points to a host that is not allow-listed
- **THEN** it is not embedded and the placeholder is shown
