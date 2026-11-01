# in-app-adverts Specification

## Purpose
Enables non-intrusive mobile advertisement delivery for users on the free tier to generate revenue, while strictly protecting training focus and respecting user privacy.

## Requirements

### Requirement: Anchored banner ad presentation for free tier users
The system SHALL display an anchored banner advertisement at the bottom of the World Map screen when the user does not possess an active LeadMate Plus membership.

#### Scenario: Free user viewing World Map
- **WHEN** a user without an active Plus trial or subscription views the World Map
- **THEN** an anchored banner advertisement is displayed at the bottom of the screen above system navigation

#### Scenario: Plus user viewing World Map
- **WHEN** a user with an active Plus trial or subscription views the World Map
- **THEN** no banner ad is displayed and the map screen uses normal bottom padding

### Requirement: Transition interstitial ads on Stage completion
The system SHALL present a full-screen interstitial advertisement to free tier users upon exiting a completed Stage or Daily walk debrief, subject to a minimum cooldown interval.

#### Scenario: Stage completion after cooldown period
- **WHEN** a free tier user completes a Stage, reviews the debrief, and taps to return to the World Map after the cooldown interval has elapsed
- **THEN** an interstitial ad is presented before navigating back to the World Map

#### Scenario: Stage completion before cooldown period elapses
- **WHEN** a free tier user completes a Stage and returns to the World Map before the cooldown interval has elapsed
- **THEN** no interstitial ad is presented and the World Map opens immediately

### Requirement: Non-disruption of active training simulations
The system SHALL strictly prohibit the presentation or interruption of advertisements during active walk simulations, timing minigames, and interactive coaching exercises.

#### Scenario: Active walk simulation in progress
- **WHEN** a free tier user starts or plays an interactive walk Stage or minigame
- **THEN** no banner, interstitial, or promotional advertisement is rendered or overlaid on the simulation view

### Requirement: Dynamic ad dismissal on Plus upgrade
The system SHALL immediately dismiss all active advertisements and disable future ad presentations when a free user starts a trial or activates a Plus subscription.

#### Scenario: User starts trial from World Map
- **WHEN** a free user starts the 7-day trial or purchases a subscription
- **THEN** the active banner ad is immediately unmounted from the World Map without requiring an app reload

### Requirement: User consent and privacy compliance
The system SHALL request and respect user consent for advertising personalization and tracking according to applicable regional regulations before requesting advertisements.

#### Scenario: User grants advertising consent
- **WHEN** a user provides affirmative consent through the consent dialog
- **THEN** the advertising service requests personalized advertisements

#### Scenario: User denies advertising consent or tracking is restricted
- **WHEN** a user declines consent or tracking is restricted by operating system policy
- **THEN** the advertising service requests non-personalized advertisements only

### Requirement: Non-native and offline graceful fallback
The system SHALL gracefully degrade advertising operations in environments without native ad support or when network connectivity is unavailable, ensuring zero disruptions or crashes.

#### Scenario: App execution in web or test environment
- **WHEN** the application runs on web, desktop browser, or in test automation
- **THEN** the advertising subsystem operates in non-rendering mock mode without throwing exceptions

#### Scenario: Network unavailable when loading ad
- **WHEN** a free tier user navigates the app while offline or on an unstable network connection
- **THEN** ad spaces collapse cleanly without presenting error dialogs or blocking user navigation
