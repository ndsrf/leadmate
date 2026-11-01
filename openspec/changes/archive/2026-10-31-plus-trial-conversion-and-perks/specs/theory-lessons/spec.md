# Spec Delta: theory-lessons

## ADDED Requirements

### Requirement: Plus-gated video demonstrations
The system SHALL restrict video demonstration playback to users with LeadMate Plus. For free users, the video block SHALL display a locked preview overlay over the poster art with an unlock button that opens the paywall while retaining the pending play action. For Plus users (trial or full), the video block SHALL display an unlocked Plus badge and allow direct playback.

#### Scenario: Free user encounters video demonstration
- **WHEN** a user without an active Plus membership views a Lesson containing a video block
- **THEN** the video card displays a locked overlay and an unlock button, and tapping the unlock button opens the paywall

#### Scenario: Active trial user plays video demonstration
- **WHEN** a user with an active trial views a Lesson containing a video block
- **THEN** the video card displays a "Desbloqueado con Plus" badge and the play button starts video playback

#### Scenario: Reading non-video content remains unrestricted
- **WHEN** a free user reads a Lesson with a gated video block
- **THEN** all headings, body text, illustrations, steps, tips, and takeaways remain fully accessible and readable
