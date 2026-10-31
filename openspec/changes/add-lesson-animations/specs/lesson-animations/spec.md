# Spec Delta

## Purpose

Gives theory Lessons short animations of our own, in the style of the Lesson illustrations, hosted outside the app bundle and fetched only when the user plays them, together with the prompt book used to produce them.

## ADDED Requirements

### Requirement: Lesson animations are named, not addressed
A Lesson Video that plays a Lesson Animation SHALL name it by a short key of lowercase letters, digits and "-". The system SHALL build the clip address only from the configured media base, a fixed folder and the key with a fixed extension; nothing else from Lesson data SHALL become part of the address.

#### Scenario: Address from a key
- **WHEN** the media base is `https://media.example.com/lesson-media` and an animation block names `calm-leash`
- **THEN** the clip address is `https://media.example.com/lesson-media/animations/calm-leash.mp4`

#### Scenario: Malformed key
- **WHEN** an animation block names a key containing "/", "." or any character outside lowercase letters, digits and "-"
- **THEN** no address is built and the block shows the themed placeholder

#### Scenario: Malformed key caught before release
- **WHEN** the project's checks run and any Lesson declares a malformed animation key
- **THEN** the checks fail and name the Lesson and key

#### Scenario: Non-HTTPS base
- **WHEN** the configured media base is not an `https` address
- **THEN** no clip address is built

### Requirement: No media base, no animation block
When no valid media base is configured, the system SHALL leave animation blocks out of Lessons, so a build without hosting shows no dead animation and its reading times do not count one. YouTube blocks are unaffected.

#### Scenario: Build without hosting
- **WHEN** the app is built without a media base
- **THEN** no Lesson shows an animation block, YouTube blocks still show, and reading times count only the blocks shown

### Requirement: Animation placement in a Lesson
A theory Lesson that has a Lesson Animation SHALL show it right after its "how to do it" steps, with its own caption and alt text from the catalog and its own bundled poster showing the clip's opening pose, independent of any YouTube video the Lesson also has. Reading time SHALL count a Lesson Animation like an illustration, not like a YouTube video.

#### Scenario: Poster matches the clip
- **WHEN** a Lesson with a Lesson Animation is opened
- **THEN** the animation block shows its own poster, not the generic video poster and not an illustration already shown in the Lesson

#### Scenario: Reading time with both kinds
- **WHEN** a Lesson holds one Lesson Animation and one YouTube video
- **THEN** its reading time adds the illustration allowance for the animation and the video allowance for the YouTube video

#### Scenario: Animation and YouTube in one Lesson
- **WHEN** a Lesson declares both an animation and a YouTube video
- **THEN** the animation follows the steps, the YouTube video follows the do / don't comparison, and each has its own caption

#### Scenario: Every first-week Lesson animated
- **WHEN** any of the five first-week theory Lessons is opened with a media base configured
- **THEN** it shows an animation block after its steps

### Requirement: Lesson animation clip format
Every hosted Lesson animation SHALL be an MP4 (H.264) clip of at most 15 seconds and at most 5 MB, 16:9, with no spoken words, no on-screen text and no meaning carried by sound, so it needs no translation and works muted.

#### Scenario: Muted viewing
- **WHEN** a Lesson animation plays with the device muted
- **THEN** its idea is fully understood from the picture and the block's caption

### Requirement: Every Lesson animation has a timeline
Every Lesson Animation SHALL have an Animation Timeline, hosted next to the clip and kept in the project. It records the time of each beat and of each Line, and the clip's duration. The system SHALL build the timeline address only from the media base, the fixed folder and the key with a fixed extension. It SHALL fetch the timeline only after the user taps play. A timeline that is missing, too large or invalid SHALL NOT stop the clip from playing.

#### Scenario: Timeline address from a key
- **WHEN** the media base is `https://media.example.com/lesson-media` and an animation block names `calm-leash`
- **THEN** the timeline address is `https://media.example.com/lesson-media/animations/calm-leash.json`

#### Scenario: Missing or invalid timeline
- **WHEN** the timeline cannot be fetched, or its times are out of order, overlapping, negative or past the clip's duration
- **THEN** the clip plays normally without subtitles and no error is shown

#### Scenario: Timeline checked before release
- **WHEN** the project's checks run
- **THEN** every animation key has a valid timeline copy in the project, and every Line in it has catalog text

### Requirement: Spoken moments are subtitled
A Line is a short word the Person says in a Lesson Animation. While the clip plays, the system SHALL show each Line as a subtitle during its time range, drawn by the app over the clip, with text from the localization catalog and never from the timeline. A Line MAY be marked as the Handler's Cue or the Marker word, so that the user's own recording can later be played at its start. Playing a Line's audio SHALL NOT replace its subtitle: the Line is shown on screen whether or not audio plays.

#### Scenario: Line shown in time
- **WHEN** an animation is playing and its playback time is inside a Line's time range
- **THEN** that Line's catalog text is shown as a subtitle, and no subtitle is shown outside any Line's range

#### Scenario: Loop restarts subtitles
- **WHEN** the clip loops back to the start
- **THEN** the subtitles follow the new playback time from the beginning

#### Scenario: Unknown Line
- **WHEN** a timeline names a Line with no catalog text
- **THEN** that Line is not shown and the rest of the timeline still works

#### Scenario: Voice moments are marked
- **WHEN** the Person says a Cue or the Marker word in a clip
- **THEN** its Line is marked as a Cue or a Marker in the timeline

#### Scenario: Subtitle stays with audio
- **WHEN** a Line's audio plays at its start
- **THEN** its subtitle is still shown for the Line's whole time range

### Requirement: Prompt book for every Lesson animation
The project SHALL keep a prompt book that lists, for every Lesson that has a Lesson Animation, the animation key, the Lesson it belongs to, the one idea it shows, its starting image, its beats and Lines (matching its stored timeline) and a complete generation prompt, plus a shared style description, a shared list of things to avoid, the technical settings, and the upload location and caching. Adding a Lesson Animation to a Lesson SHALL add its entry to the book.

#### Scenario: Every animation has a prompt
- **WHEN** any Lesson declares a Lesson Animation with key `k`
- **THEN** the prompt book contains an entry for `k` with a complete prompt and a target timeline, and its beats and Lines match the stored timeline for `k`

#### Scenario: Timings measured from the clip
- **WHEN** a generated clip is accepted
- **THEN** the prompt book's timing prompt gives its measured timeline in the stored timeline format, and a person checks it before it is uploaded

#### Scenario: Style matches the illustrations
- **WHEN** a prompt from the book is used
- **THEN** it asks for the flat paper-cut look, the app's palette and the same mascot Dog and Person as the Lesson illustrations, with no text in frame
