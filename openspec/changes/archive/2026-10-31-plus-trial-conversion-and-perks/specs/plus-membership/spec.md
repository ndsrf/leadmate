# Spec Delta: plus-membership

## ADDED Requirements

### Requirement: Trial lifecycle states and countdown
The system SHALL determine the user's trial lifecycle state as unstarted when no trial start is recorded, active when within 7 days from the recorded start, or expired when 7 days have elapsed. While active, the system SHALL compute remaining days as integer days from 1 to 7.

#### Scenario: Active trial with 5 days left
- **WHEN** the trial started 2 days ago
- **THEN** trial state is active and remaining days is 5

#### Scenario: Trial on its final day
- **WHEN** the trial started 6 days and 18 hours ago
- **THEN** trial state is active and remaining days is 1

#### Scenario: Trial expired
- **WHEN** the trial started 7 days and 1 hour ago
- **THEN** trial state is expired

### Requirement: Post-trial Value Recap presentation
On the first app launch after the trial expires, the system SHALL present a Value Recap screen that summarizes the user's achievements during the trial, including active streak days, completed videos, and Day Skips used. The screen SHALL provide full subscription options and a clear bypass button to continue on the free tier.

#### Scenario: First launch after trial expiry
- **WHEN** the app opens for the first time after the 7-day trial has elapsed
- **THEN** the Value Recap screen is displayed with dog activity stats and subscription choices

#### Scenario: Bypassing the Value Recap
- **WHEN** the user selects "Continuar con la versión gratuita" on the Value Recap screen
- **THEN** the user enters the World Map as a free user and the Value Recap does not show again on subsequent launches

#### Scenario: Re-encountering conversion after trial expiry
- **WHEN** a user with an expired trial taps a Plus-only feature or the expired map chip
- **THEN** the conversion screen is displayed with full subscription options

### Requirement: Pending action completion on trial start or subscription
When a user starts the trial or subscribes from a Plus-only feature trigger, the system SHALL activate Plus membership, return the user to the initiating screen, and execute the pending action immediately without requiring a second tap.

#### Scenario: Starting trial from a locked video
- **WHEN** a free user taps a locked video card and starts the trial on the paywall
- **THEN** the user is returned to the Lesson with the video playing

#### Scenario: Dismissing paywall keeps pending action unexecuted
- **WHEN** a free user taps a locked video card and dismisses the paywall with "Quizá más tarde"
- **THEN** the user is returned to the Lesson with the video remaining locked

### Requirement: Mock subscription confers Plus membership
The system SHALL consider the user as possessing LeadMate Plus when either an active trial is in progress or a subscription has been recorded in onboarding state (`mockSubscribed`).

#### Scenario: Subscribing after trial expiry
- **WHEN** a user with an expired trial selects a subscription plan
- **THEN** the user receives Plus membership and access to all Plus features
