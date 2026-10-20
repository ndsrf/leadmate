# Spec Delta

## Purpose

Enables nodes to reference external hosted media such as images, instructional videos, and web-hosted tutorials, providing an in-app slide-over browser and resilient canine-themed placeholders when offline, missing, or pending.

## ADDED Requirements

### Requirement: Declarative remote media references
The system SHALL support declaring external media attachments (images, diagrams, video resources, and web-hosted tutorial links) within Node and Theory Primer definitions, specifying media type, source URL, descriptive caption, and optional placeholder indicator.

#### Scenario: Node declares external image
- **WHEN** a Node definition specifies an external image URL for a Theory Primer card
- **THEN** the system resolves the media reference and attempts to load the image into the card layout

#### Scenario: Node declares web-hosted tutorial URL
- **WHEN** a Node definition specifies an external tutorial URL for a Theory Primer card
- **THEN** the system presents an "Open Full Guide" button that allows opening the web-hosted tutorial in an in-app browser slide-over

### Requirement: In-app tutorial browser modal
The system SHALL provide an in-app slide-over browser that renders web-hosted tutorials containing multimedia (rich text, images, videos) without forcing the user out of the app, preserving the active Theory Primer position.

#### Scenario: User opens web tutorial
- **WHEN** the user taps the tutorial link action on a Theory Primer card
- **THEN** the system opens the in-app browser slide-over displaying the web tutorial, with a close button returning directly to the card

#### Scenario: Offline or unreachable web tutorial
- **WHEN** the in-app browser attempts to open an unreachable URL or the device is offline
- **THEN** the modal displays an offline notice with retry action, while the underlying card remains fully readable

### Requirement: Media placeholder and graceful fallback
The system SHALL display a themed media placeholder whenever an external media item has an empty or placeholder URL, is loading, or encounters a network error, preserving layout stability and communicating content availability.

#### Scenario: Placeholder media configuration
- **WHEN** a card contains a media item marked as a placeholder or having an empty URL
- **THEN** the system renders a styled canine illustration placeholder with a badge indicating the media type and the descriptive caption

#### Scenario: Network error or offline mode
- **WHEN** an external image fails to load due to network error or offline status
- **THEN** the system displays the fallback placeholder without crashing or blocking progression through the lesson
